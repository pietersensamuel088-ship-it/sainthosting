import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import Database from 'better-sqlite3';

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
  embedColor: string;
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
  ephemeral?: boolean;
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
  subdomainConsoleUrl?: string;
  discordApp?: {
    id: string;
    username: string;
    avatarUrl: string;
    inviteUrl: string;
    maskedToken: string;
    syncedAt: string;
  };
  submittedAt: string;
  approvedAt?: string;
  rejectionReason?: string;
  pipelineLogs: Array<{ stage: string; message: string; timestamp: string }>;
  liveTerminalLogs: Array<{ time: string; level: 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR'; text: string }>;
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

const DB_DIR = path.resolve(__dirname, '../../data');
const DB_SQLITE_FILE = path.join(DB_DIR, 'saint.db');
const LEGACY_JSON_FILE = path.join(DB_DIR, 'store.json');

class DatabaseStore {
  private db: Database.Database;

  constructor() {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }

    this.db = new Database(DB_SQLITE_FILE);
    this.db.pragma('journal_mode = WAL');
    this.initTables();
    this.migrateFromLegacyJson();
  }

  private initTables(): void {
    // 1. Users Table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        username TEXT NOT NULL,
        password_hash TEXT,
        salt TEXT,
        provider TEXT NOT NULL DEFAULT 'local',
        discord_id TEXT,
        avatar_url TEXT,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_discord_id ON users(discord_id);
    `);

    // 2. Bots Table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS bots (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        user_email TEXT NOT NULL,
        type TEXT NOT NULL,
        name TEXT NOT NULL,
        source_url TEXT,
        scope_summary TEXT,
        framework TEXT NOT NULL,
        customization_json TEXT,
        slash_commands_json TEXT,
        status TEXT NOT NULL,
        container_id TEXT,
        slot_index INTEGER,
        subdomain_console_url TEXT,
        discord_app_json TEXT,
        submitted_at TEXT NOT NULL,
        approved_at TEXT,
        rejection_reason TEXT,
        pipeline_logs_json TEXT NOT NULL,
        live_terminal_logs_json TEXT NOT NULL,
        telemetry_json TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_bots_user_id ON bots(user_id);
      CREATE INDEX IF NOT EXISTS idx_bots_status ON bots(status);
    `);

    // 3. Cluster Containers Table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS containers (
        id TEXT PRIMARY KEY,
        label TEXT NOT NULL,
        vmid INTEGER NOT NULL,
        node_host TEXT NOT NULL,
        status TEXT NOT NULL,
        allocated_bots_json TEXT NOT NULL,
        max_bots INTEGER NOT NULL DEFAULT 5,
        cpu_cores INTEGER NOT NULL,
        allocated_memory_mb INTEGER NOT NULL,
        uptime_seconds INTEGER NOT NULL
      );
    `);

    // Ensure default primary container exists if empty
    const count = this.db.prepare('SELECT COUNT(*) as count FROM containers').get() as { count: number };
    if (count.count === 0) {
      this.addContainer({
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
      });
    }
  }

  private migrateFromLegacyJson(): void {
    try {
      if (fs.existsSync(LEGACY_JSON_FILE)) {
        const raw = fs.readFileSync(LEGACY_JSON_FILE, 'utf-8');
        const parsed = JSON.parse(raw);

        // Migrate users if any
        if (Array.isArray(parsed.users)) {
          for (const u of parsed.users) {
            const exists = this.findUserByEmail(u.email);
            if (!exists) {
              this.db.prepare(`
                INSERT INTO users (id, email, username, password_hash, salt, provider, discord_id, avatar_url, created_at)
                VALUES (@id, @email, @username, @passwordHash, @salt, @provider, @discordId, @avatarUrl, @createdAt)
              `).run({
                id: u.id,
                email: u.email.toLowerCase(),
                username: u.username,
                passwordHash: u.passwordHash || null,
                salt: u.salt || null,
                provider: u.provider || 'local',
                discordId: u.discordId || null,
                avatarUrl: u.avatarUrl || null,
                createdAt: u.createdAt || new Date().toISOString(),
              });
            }
          }
        }

        // Migrate bots if any
        if (Array.isArray(parsed.bots)) {
          for (const b of parsed.bots) {
            const exists = this.getBotById(b.id);
            if (!exists) {
              this.insertBotRecord(b);
            }
          }
        }
      }
    } catch (err) {
      console.warn('[DB_MIGRATION_NOTICE]', err);
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
    const cleanEmail = userData.email.toLowerCase().trim();
    const existing = this.findUserByEmail(cleanEmail);
    if (existing) {
      throw new Error('An account with this email address already exists.');
    }

    let salt: string | null = null;
    let passwordHash: string | null = null;

    if (userData.password) {
      const hashed = this.hashPassword(userData.password);
      salt = hashed.salt;
      passwordHash = hashed.hash;
    }

    const newUser: UserRecord = {
      id: `usr_${crypto.randomBytes(8).toString('hex')}`,
      email: cleanEmail,
      username: userData.username.trim(),
      passwordHash: passwordHash || undefined,
      salt: salt || undefined,
      provider: userData.provider,
      discordId: userData.discordId,
      avatarUrl: userData.avatarUrl || 'https://cdn.discordapp.com/embed/avatars/0.png',
      createdAt: new Date().toISOString(),
    };

    const stmt = this.db.prepare(`
      INSERT INTO users (id, email, username, password_hash, salt, provider, discord_id, avatar_url, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      newUser.id,
      newUser.email,
      newUser.username,
      newUser.passwordHash || null,
      newUser.salt || null,
      newUser.provider,
      newUser.discordId || null,
      newUser.avatarUrl || null,
      newUser.createdAt
    );

    return newUser;
  }

  public findUserByEmail(email: string): UserRecord | undefined {
    const row: any = this.db.prepare('SELECT * FROM users WHERE lower(email) = ?').get(email.toLowerCase().trim());
    if (!row) return undefined;
    return this.mapUserRow(row);
  }

  public findUserById(id: string): UserRecord | undefined {
    const row: any = this.db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    if (!row) return undefined;
    return this.mapUserRow(row);
  }

  public findUserByDiscordId(discordId: string): UserRecord | undefined {
    const row: any = this.db.prepare('SELECT * FROM users WHERE discord_id = ?').get(discordId);
    if (!row) return undefined;
    return this.mapUserRow(row);
  }

  private mapUserRow(row: any): UserRecord {
    return {
      id: row.id,
      email: row.email,
      username: row.username,
      passwordHash: row.password_hash || undefined,
      salt: row.salt || undefined,
      provider: row.provider as 'local' | 'discord',
      discordId: row.discord_id || undefined,
      avatarUrl: row.avatar_url || undefined,
      createdAt: row.created_at,
    };
  }

  // --- Bots Operations ---
  public createBot(botData: Omit<BotRecord, 'id' | 'status' | 'containerId' | 'slotIndex' | 'submittedAt' | 'pipelineLogs' | 'telemetry' | 'liveTerminalLogs' | 'subdomainConsoleUrl'> & { liveTerminalLogs?: Array<{ time: string; level: 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR'; text: string }>; subdomainConsoleUrl?: string }): BotRecord {
    const id = `bot_${Date.now().toString(36).slice(-5)}`;
    const now = new Date();
    const subdomain = botData.subdomainConsoleUrl || `https://console.sa1nt.xyz/?bot=${id}`;

    const newBot: BotRecord = {
      ...botData,
      id,
      status: 'pending_approval',
      containerId: null,
      slotIndex: null,
      subdomainConsoleUrl: botData.subdomainConsoleUrl || subdomain,
      submittedAt: now.toISOString(),
      pipelineLogs: [
        {
          stage: 'Ingest',
          message: `Bot '${botData.name}' registered to account ${botData.userEmail}. Staged for review.`,
          timestamp: now.toLocaleTimeString(),
        },
      ],
      liveTerminalLogs: botData.liveTerminalLogs || [
        {
          time: now.toLocaleTimeString(),
          level: 'INFO',
          text: `[SYSTEM] Staged bot '${botData.name}' under account clearance [${botData.userEmail}].`,
        },
        {
          time: now.toLocaleTimeString(),
          level: 'INFO',
          text: `[SECURITY] Subdomain reservation assigned: ${subdomain} (Encrypted Tunnel).`,
        },
        {
          time: now.toLocaleTimeString(),
          level: 'WARN',
          text: `[GATEKEEPER] Awaiting administrator signature to mount into LXC container slot.`,
        },
      ],
      telemetry: { cpuPercent: 0, memoryMb: 0, restarts: 0, uptime: '0s' },
    };

    this.insertBotRecord(newBot);
    return newBot;
  }

  private insertBotRecord(bot: BotRecord): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO bots (
        id, user_id, user_email, type, name, source_url, scope_summary, framework,
        customization_json, slash_commands_json, status, container_id, slot_index,
        subdomain_console_url, discord_app_json, submitted_at, approved_at, rejection_reason,
        pipeline_logs_json, live_terminal_logs_json, telemetry_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      bot.id,
      bot.userId,
      bot.userEmail,
      bot.type,
      bot.name,
      bot.sourceUrl || null,
      bot.scopeSummary || null,
      bot.framework,
      bot.customization ? JSON.stringify(bot.customization) : null,
      bot.slashCommands ? JSON.stringify(bot.slashCommands) : null,
      bot.status,
      bot.containerId,
      bot.slotIndex,
      bot.subdomainConsoleUrl || null,
      bot.discordApp ? JSON.stringify(bot.discordApp) : null,
      bot.submittedAt,
      bot.approvedAt || null,
      bot.rejectionReason || null,
      JSON.stringify(bot.pipelineLogs || []),
      JSON.stringify(bot.liveTerminalLogs || []),
      JSON.stringify(bot.telemetry || { cpuPercent: 0, memoryMb: 0, restarts: 0, uptime: '0s' })
    );
  }

  public getBotsByUserId(userId: string): BotRecord[] {
    const rows: any[] = this.db.prepare('SELECT * FROM bots WHERE user_id = ? ORDER BY datetime(submitted_at) DESC').all(userId);
    return rows.map((r) => this.mapBotRow(r));
  }

  public getAllBots(): BotRecord[] {
    const rows: any[] = this.db.prepare('SELECT * FROM bots ORDER BY datetime(submitted_at) DESC').all();
    return rows.map((r) => this.mapBotRow(r));
  }

  public getBotById(id: string): BotRecord | undefined {
    const row: any = this.db.prepare('SELECT * FROM bots WHERE id = ?').get(id);
    if (!row) return undefined;
    return this.mapBotRow(row);
  }

  public updateBot(id: string, updates: Partial<BotRecord>): BotRecord | undefined {
    const current = this.getBotById(id);
    if (!current) return undefined;

    const merged: BotRecord = {
      ...current,
      ...updates,
      telemetry: { ...current.telemetry, ...(updates.telemetry || {}) },
    };

    this.insertBotRecord(merged);
    return merged;
  }

  private mapBotRow(row: any): BotRecord {
    return {
      id: row.id,
      userId: row.user_id,
      userEmail: row.user_email,
      type: row.type as 'github_repo' | 'ai_blueprint',
      name: row.name,
      sourceUrl: row.source_url || undefined,
      scopeSummary: row.scope_summary || undefined,
      framework: row.framework,
      customization: row.customization_json ? JSON.parse(row.customization_json) : undefined,
      slashCommands: row.slash_commands_json ? JSON.parse(row.slash_commands_json) : undefined,
      status: row.status as 'pending_approval' | 'approved' | 'running' | 'rejected',
      containerId: row.container_id,
      slotIndex: row.slot_index,
      subdomainConsoleUrl: row.subdomain_console_url || undefined,
      discordApp: row.discord_app_json ? JSON.parse(row.discord_app_json) : undefined,
      submittedAt: row.submitted_at,
      approvedAt: row.approved_at || undefined,
      rejectionReason: row.rejection_reason || undefined,
      pipelineLogs: row.pipeline_logs_json ? JSON.parse(row.pipeline_logs_json) : [],
      liveTerminalLogs: row.live_terminal_logs_json ? JSON.parse(row.live_terminal_logs_json) : [],
      telemetry: row.telemetry_json ? JSON.parse(row.telemetry_json) : { cpuPercent: 0, memoryMb: 0, restarts: 0, uptime: '0s' },
    };
  }

  // --- Containers Operations ---
  public getContainers(): ClusterContainerRecord[] {
    const rows: any[] = this.db.prepare('SELECT * FROM containers').all();
    return rows.map((r) => ({
      id: r.id,
      label: r.label,
      vmid: r.vmid,
      nodeHost: r.node_host,
      status: r.status as 'active' | 'packed_full' | 'provisioning',
      allocatedBots: r.allocated_bots_json ? JSON.parse(r.allocated_bots_json) : [],
      maxBots: r.max_bots as 5,
      cpuCores: r.cpu_cores,
      allocatedMemoryMb: r.allocated_memory_mb,
      uptimeSeconds: r.uptime_seconds,
    }));
  }

  public addContainer(container: ClusterContainerRecord): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO containers (
        id, label, vmid, node_host, status, allocated_bots_json, max_bots, cpu_cores, allocated_memory_mb, uptime_seconds
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      container.id,
      container.label,
      container.vmid,
      container.nodeHost,
      container.status,
      JSON.stringify(container.allocatedBots || []),
      container.maxBots || 5,
      container.cpuCores,
      container.allocatedMemoryMb,
      container.uptimeSeconds
    );
  }

  public updateContainer(id: string, updates: Partial<ClusterContainerRecord>): void {
    const containers = this.getContainers();
    const current = containers.find((c) => c.id === id);
    if (current) {
      const merged: ClusterContainerRecord = {
        ...current,
        ...updates,
      };
      this.addContainer(merged);
    }
  }
}

export const dbStore = new DatabaseStore();
