import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface UserRecord {
  id: string;
  email: string;
  username: string;
  passwordHash?: string;
  salt?: string;
  provider: 'local' | 'discord';
  discordId?: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface DiscordCustomization {
  statusMode: 'online' | 'idle' | 'dnd' | 'invisible';
  activityType: 'Playing' | 'Streaming' | 'Listening to' | 'Watching' | 'Competing in' | 'Custom';
  activityText: string;
  streamUrl?: string;
  embedColor: string; // e.g. '#FF0000'
  embedAuthorName?: string;
  embedFooterText?: string;
  enableTimestamps: boolean;
  intents: {
    messageContent: boolean;
    guildMembers: boolean;
    guildPresences: boolean;
  };
  ephemeralReplies: boolean;
  defaultAdminOnly: boolean;
}

export interface SlashCommandDef {
  name: string;
  description: string;
  parameters?: string;
}

export interface BotRecord {
  id: string;
  userId: string;
  userEmail: string;
  type: 'github_repo' | 'ai_blueprint';
  name: string;
  sourceUrl?: string;
  scopeSummary?: string;
  framework: string;
  customization?: DiscordCustomization;
  slashCommands?: SlashCommandDef[];
  status: 'pending_approval' | 'approved' | 'running' | 'rejected';
  containerId: string | null;
  slotIndex: number | null;
  submittedAt: string;
  approvedAt?: string;
  rejectionReason?: string;
  pipelineLogs: Array<{ stage: string; message: string; timestamp: string }>;
  telemetry: {
    cpuPercent: number;
    memoryMb: number;
    restarts: number;
    uptime: string;
  };
}

export interface ClusterContainerRecord {
  id: string;
  label: string;
  vmid: number;
  nodeHost: string;
  status: 'active' | 'packed_full' | 'provisioning';
  allocatedBots: string[];
  maxBots: 5;
  cpuCores: number;
  allocatedMemoryMb: number;
  uptimeSeconds: number;
}

interface DatabaseSchema {
  users: UserRecord[];
  bots: BotRecord[];
  containers: ClusterContainerRecord[];
}

const DB_DIR = path.resolve(__dirname, '../../data');
const DB_FILE = path.join(DB_DIR, 'store.json');

class DatabaseStore {
  private data: DatabaseSchema = {
    users: [],
    bots: [],
    containers: [
      {
        id: 'lxc-node-101',
        label: 'SAINT-POD-01',
        vmid: 101,
        nodeHost: 'pve-saint',
        status: 'active',
        allocatedBots: [],
        maxBots: 5,
        cpuCores: 2,
        allocatedMemoryMb: 2048,
        uptimeSeconds: 0,
      },
    ],
  };

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        if (!this.data.containers || this.data.containers.length === 0) {
          this.data.containers = [
            {
              id: 'lxc-node-101',
              label: 'SAINT-POD-01',
              vmid: 101,
              nodeHost: 'pve-saint',
              status: 'active',
              allocatedBots: [],
              maxBots: 5,
              cpuCores: 2,
              allocatedMemoryMb: 2048,
              uptimeSeconds: 0,
            },
          ];
        }
      } else {
        this.save();
      }
    } catch (err) {
      console.error('[DB_INIT_ERROR]', err);
    }
  }

  private save() {
    try {
      const tempPath = `${DB_FILE}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tempPath, DB_FILE);
    } catch (err) {
      console.error('[DB_SAVE_ERROR]', err);
    }
  }

  // --- Password Hashing with PBKDF2 ---
  public hashPassword(password: string): { salt: string; hash: string } {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return { salt, hash };
  }

  public verifyPassword(password: string, hash: string, salt: string): boolean {
    const candidateHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(candidateHash, 'hex'));
  }

  // --- Users Operations ---
  public createUser(userData: {
    email: string;
    username: string;
    password?: string;
    provider: 'local' | 'discord';
    discordId?: string;
    avatarUrl?: string;
  }): UserRecord {
    const existing = this.data.users.find(
      (u) => u.email.toLowerCase() === userData.email.toLowerCase()
    );
    if (existing) {
      throw new Error('An account with this email address already exists.');
    }

    let salt: string | undefined;
    let passwordHash: string | undefined;

    if (userData.password) {
      const hashed = this.hashPassword(userData.password);
      salt = hashed.salt;
      passwordHash = hashed.hash;
    }

    const newUser: UserRecord = {
      id: `usr_${crypto.randomBytes(8).toString('hex')}`,
      email: userData.email.toLowerCase(),
      username: userData.username,
      passwordHash,
      salt,
      provider: userData.provider,
      discordId: userData.discordId,
      avatarUrl: userData.avatarUrl || 'https://cdn.discordapp.com/embed/avatars/0.png',
      createdAt: new Date().toISOString(),
    };

    this.data.users.push(newUser);
    this.save();
    return newUser;
  }

  public findUserByEmail(email: string): UserRecord | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public findUserById(id: string): UserRecord | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  public findUserByDiscordId(discordId: string): UserRecord | undefined {
    return this.data.users.find((u) => u.discordId === discordId);
  }

  // --- Bots Operations ---
  public createBot(botData: Omit<BotRecord, 'id' | 'status' | 'containerId' | 'slotIndex' | 'submittedAt' | 'pipelineLogs' | 'telemetry'>): BotRecord {
    const id = `bot_${Date.now().toString(36).slice(-5)}`;
    const now = new Date();

    const newBot: BotRecord = {
      ...botData,
      id,
      status: 'pending_approval',
      containerId: null,
      slotIndex: null,
      submittedAt: now.toISOString(),
      pipelineLogs: [
        {
          stage: 'Ingest',
          message: `Bot '${botData.name}' registered to account ${botData.userEmail}. Staged for review.`,
          timestamp: now.toLocaleTimeString(),
        },
      ],
      telemetry: { cpuPercent: 0, memoryMb: 0, restarts: 0, uptime: '0s' },
    };

    this.data.bots.push(newBot);
    this.save();
    return newBot;
  }

  public getBotsByUserId(userId: string): BotRecord[] {
    return this.data.bots
      .filter((b) => b.userId === userId)
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  }

  public getAllBots(): BotRecord[] {
    return [...this.data.bots].sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );
  }

  public getBotById(id: string): BotRecord | undefined {
    return this.data.bots.find((b) => b.id === id);
  }

  public updateBot(id: string, updates: Partial<BotRecord>): BotRecord | undefined {
    const bot = this.data.bots.find((b) => b.id === id);
    if (!bot) return undefined;
    Object.assign(bot, updates);
    this.save();
    return bot;
  }

  // --- Containers Operations ---
  public getContainers(): ClusterContainerRecord[] {
    return this.data.containers;
  }

  public addContainer(container: ClusterContainerRecord): void {
    this.data.containers.push(container);
    this.save();
  }

  public updateContainer(id: string, updates: Partial<ClusterContainerRecord>): void {
    const c = this.data.containers.find((item) => item.id === id);
    if (c) {
      Object.assign(c, updates);
      this.save();
    }
  }
}

export const dbStore = new DatabaseStore();
