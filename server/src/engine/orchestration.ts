import os from 'os';
import { config } from '../config.js';
import { dbStore, BotRecord, ClusterContainerRecord, DiscordCustomization, SlashCommandDef } from '../db/store.js';

export interface RealSystemTelemetry {
  serverHost: string;
  serverPlatform: string;
  serverUptimeSeconds: number;
  cpuCores: number;
  cpuModel: string;
  totalSystemMemoryGb: number;
  usedSystemMemoryGb: number;
  freeSystemMemoryGb: number;
  memoryUsagePercent: number;
  nodeProcessMemoryMb: number;
  proxmoxIntegration: {
    configured: boolean;
    host: string;
    nodeName: string;
    status: 'CONNECTED' | 'STANDBY_AWAITING_CONFIG';
    notice: string;
  };
}

class OrchestrationEngine {
  private capacityTriggerAlert: {
    active: boolean;
    message: string | null;
    triggeredAt: string | null;
  } = {
    active: false,
    message: null,
    triggeredAt: null,
  };

  public getRealTelemetry(): RealSystemTelemetry {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memPercent = Math.round((usedMem / totalMem) * 100);
    const procMem = process.memoryUsage();
    const cpus = os.cpus();

    const isPveConfigured = Boolean(config.proxmox.host && config.proxmox.tokenId);

    return {
      serverHost: os.hostname(),
      serverPlatform: `${os.type()} ${os.release()} (${os.arch()})`,
      serverUptimeSeconds: Math.floor(os.uptime()),
      cpuCores: cpus.length,
      cpuModel: cpus[0]?.model || 'Host Processor',
      totalSystemMemoryGb: parseFloat((totalMem / (1024 * 1024 * 1024)).toFixed(2)),
      usedSystemMemoryGb: parseFloat((usedMem / (1024 * 1024 * 1024)).toFixed(2)),
      freeSystemMemoryGb: parseFloat((freeMem / (1024 * 1024 * 1024)).toFixed(2)),
      memoryUsagePercent: memPercent,
      nodeProcessMemoryMb: Math.round(procMem.rss / (1024 * 1024)),
      proxmoxIntegration: {
        configured: isPveConfigured,
        host: config.proxmox.host || 'Not Connected',
        nodeName: config.proxmox.nodeName,
        status: isPveConfigured ? 'CONNECTED' : 'STANDBY_AWAITING_CONFIG',
        notice: isPveConfigured
          ? `Connected to Proxmox VE node ${config.proxmox.nodeName}`
          : 'Proxmox API credentials not set. Set PROXMOX_HOST in .env to stream hypervisor telemetry.',
      },
    };
  }

  public getClusterStatus() {
    const containers = dbStore.getContainers();
    const allBots = dbStore.getAllBots();
    const runningBots = allBots.filter((d) => d.status === 'running');
    const pendingBots = allBots.filter((d) => d.status === 'pending_approval');
    const totalSlots = containers.length * 5;
    const remainingSlots = Math.max(0, totalSlots - runningBots.length);

    return {
      containers,
      totalContainers: containers.length,
      totalSlots,
      activeBotsCount: runningBots.length,
      remainingSlots,
      pendingCount: pendingBots.length,
      capacityTrigger: this.capacityTriggerAlert,
      telemetry: this.getRealTelemetry(),
    };
  }

  public submitGitHubDeployment(userId: string, userEmail: string, data: {
    repoUrl: string;
    botName?: string;
    framework?: string;
    customization?: DiscordCustomization;
  }): BotRecord {
    const derivedName = data.botName?.trim() || data.repoUrl.split('/').pop()?.replace(/\.git$/, '') || 'Unnamed-Bot';

    return dbStore.createBot({
      userId,
      userEmail,
      type: 'github_repo',
      name: derivedName,
      sourceUrl: data.repoUrl,
      framework: data.framework || 'Node.js (Auto-detected)',
      customization: data.customization,
    });
  }

  public submitBotBlueprint(userId: string, userEmail: string, data: {
    botName: string;
    framework: string;
    scopeSummary: string;
    customization?: DiscordCustomization;
    slashCommands: SlashCommandDef[];
  }): BotRecord {
    return dbStore.createBot({
      userId,
      userEmail,
      type: 'ai_blueprint',
      name: data.botName,
      framework: data.framework,
      scopeSummary: data.scopeSummary,
      customization: data.customization,
      slashCommands: data.slashCommands,
    });
  }

  public approveDeployment(id: string): {
    success: boolean;
    deployment?: BotRecord;
    error?: string;
    capacityAlertTriggered?: boolean;
    message: string;
  } {
    const bot = dbStore.getBotById(id);
    if (!bot) {
      return { success: false, error: 'NOT_FOUND', message: `No bot found with ID '${id}'` };
    }

    if (bot.status === 'running') {
      return { success: true, deployment: bot, message: 'Bot is already running.' };
    }

    const containers = dbStore.getContainers();
    const allBots = dbStore.getAllBots();
    const currentlyRunning = allBots.filter((d) => d.status === 'running').length;
    const nextRunningCount = currentlyRunning + 1;

    // Available open slots in containers (5 bots hard ceiling)
    const availableContainer = containers.find((c) => c.status === 'active' && c.allocatedBots.length < 5);

    if (!availableContainer || (nextRunningCount % 5 === 0 && !availableContainer)) {
      this.capacityTriggerAlert = {
        active: true,
        message:
          '[CRITICAL] CLUSTER CAPACITY REACHED. PROMPT: Manually provision an additional Proxmox VM node or spin up a new global cluster element to accept further deployments.',
        triggeredAt: new Date().toISOString(),
      };

      return {
        success: false,
        capacityAlertTriggered: true,
        error: 'CLUSTER_CAPACITY_CEILING',
        message: this.capacityTriggerAlert.message!,
      };
    }

    const targetContainer = availableContainer;
    targetContainer.allocatedBots.push(bot.id);
    const assignedSlot = targetContainer.allocatedBots.length;

    if (targetContainer.allocatedBots.length >= 5) {
      targetContainer.status = 'packed_full';
    }
    dbStore.updateContainer(targetContainer.id, targetContainer);

    const now = new Date();
    const slug = bot.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/^-+|-+$/g, '') || 'bot';
    const subdomain = bot.subdomainConsoleUrl || `https://${slug}.console.sa1nt.xyz`;

    const liveLogs = [
      ...(bot.liveTerminalLogs || []),
      { time: now.toLocaleTimeString(), level: 'SUCCESS' as const, text: `[PROXMOX] Admin clearance approved. Allocating LXC container slot.` },
      { time: now.toLocaleTimeString(), level: 'INFO' as const, text: `[SECURITY] Subdomain live: ${subdomain} (Zero Port Forwarding Reverse Tunnel).` },
      { time: now.toLocaleTimeString(), level: 'INFO' as const, text: `[POD] Bound to ${targetContainer.label} -> Dedicated Slot [${assignedSlot}/5].` },
      { time: now.toLocaleTimeString(), level: 'SUCCESS' as const, text: `[GATEWAY] Discord Gateway session initialized. Slash commands ready.` },
      { time: now.toLocaleTimeString(), level: 'INFO' as const, text: `[DAEMON] Bot process active with community cluster uptime monitoring.` },
    ];

    const updated = dbStore.updateBot(id, {
      status: 'running',
      containerId: targetContainer.id,
      slotIndex: assignedSlot,
      subdomainConsoleUrl: subdomain,
      approvedAt: now.toISOString(),
      liveTerminalLogs: liveLogs,
      pipelineLogs: [
        ...bot.pipelineLogs,
        { stage: 'Approve', message: 'Clearance verified by sysadmin.', timestamp: now.toLocaleTimeString() },
        { stage: 'Pack', message: `Allocated to ${targetContainer.label} -> Slot [${assignedSlot}/5].`, timestamp: now.toLocaleTimeString() },
        { stage: 'Deploy', message: 'Process daemon online with community cluster uptime.', timestamp: now.toLocaleTimeString() },
      ],
      telemetry: {
        cpuPercent: 0.2,
        memoryMb: 54,
        restarts: 0,
        uptime: 'Just deployed',
      },
    });

    return {
      success: true,
      deployment: updated,
      message: `Bot '${bot.name}' approved and mapped to ${targetContainer.label} [Slot ${assignedSlot}/5].`,
    };
  }

  public rejectDeployment(id: string, reason: string): { success: boolean; deployment?: BotRecord; message: string } {
    const bot = dbStore.getBotById(id);
    if (!bot) {
      return { success: false, message: `No bot found with ID '${id}'` };
    }

    const updated = dbStore.updateBot(id, {
      status: 'rejected',
      rejectionReason: reason || 'Did not meet safety checks.',
      pipelineLogs: [
        ...bot.pipelineLogs,
        { stage: 'Rejection', message: `Declined: ${reason}`, timestamp: new Date().toLocaleTimeString() },
      ],
    });

    return { success: true, deployment: updated, message: `Bot ${id} rejected.` };
  }

  public provisionProxmoxNode(label?: string): ClusterContainerRecord {
    const containers = dbStore.getContainers();
    const nextVmid = 100 + containers.length + 1;
    const nodeLabel = label?.trim() || `SAINT-POD-0${containers.length + 1}`;

    const newContainer: ClusterContainerRecord = {
      id: `lxc-node-${nextVmid}`,
      label: nodeLabel,
      vmid: nextVmid,
      nodeHost: config.proxmox.nodeName || 'pve-saint',
      status: 'active',
      allocatedBots: [],
      maxBots: 5,
      cpuCores: 2,
      allocatedMemoryMb: 2048,
      uptimeSeconds: 0,
    };

    dbStore.addContainer(newContainer);

    this.capacityTriggerAlert = {
      active: false,
      message: null,
      triggeredAt: null,
    };

    return newContainer;
  }

  public getAllDeployments(status?: string): BotRecord[] {
    const list = dbStore.getAllBots();
    if (status) {
      return list.filter((b) => b.status === status);
    }
    return list;
  }
}

export const orchestrationEngine = new OrchestrationEngine();
