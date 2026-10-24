export type DeploymentType = 'github_repo' | 'ai_blueprint';
export type DeploymentStatus = 'pending_approval' | 'approved' | 'rejected' | 'building' | 'running';

export interface SlashCommandDef {
  name: string;
  description: string;
  parameters?: string;
}

export interface BotDeployment {
  id: string;
  type: DeploymentType;
  name: string;
  sourceUrl?: string; // GitHub repo
  blueprintSummary?: string; // AI Blueprint scope
  framework: string;
  entrypoint?: string;
  envVariablesCount?: number;
  slashCommands?: SlashCommandDef[];
  status: DeploymentStatus;
  containerId: string | null;
  slotIndex: number | null; // 1 to 5
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

export interface ClusterContainer {
  id: string;
  label: string;
  vmid: number;
  nodeHost: string; // e.g. pve-saint-01
  status: 'active' | 'packed_full' | 'provisioning' | 'offline';
  allocatedBots: string[]; // BotDeployment IDs (Max 5)
  maxBots: 5;
  cpuCores: number;
  allocatedMemoryMb: number;
  usedMemoryMb: number;
  uptimeSeconds: number;
}

export interface ProxmoxNodeTelemetry {
  nodeName: string;
  status: 'ONLINE' | 'DEGRADED' | 'MAINTENANCE';
  cpuUtilizationPercent: number;
  ramUsagePercent: number;
  totalRamGb: number;
  usedRamGb: number;
  nvmeReadMbps: number;
  nvmeWriteMbps: number;
  nodeTemperatureC: number;
  pveVersion: string;
  kernelVersion: string;
}

class OrchestrationEngine {
  private containers: ClusterContainer[] = [
    {
      id: 'lxc-node-101',
      label: 'SAINT-POD-ALPHA',
      vmid: 101,
      nodeHost: 'pve-saint-01',
      status: 'active',
      allocatedBots: ['dep-cold-001', 'dep-cold-002', 'dep-cold-003', 'dep-cold-004'],
      maxBots: 5,
      cpuCores: 2,
      allocatedMemoryMb: 2048,
      usedMemoryMb: 1420,
      uptimeSeconds: 864200,
    },
    {
      id: 'lxc-node-102',
      label: 'SAINT-POD-BETA',
      vmid: 102,
      nodeHost: 'pve-saint-01',
      status: 'active',
      allocatedBots: ['dep-cold-005', 'dep-cold-006', 'dep-cold-007'],
      maxBots: 5,
      cpuCores: 2,
      allocatedMemoryMb: 2048,
      usedMemoryMb: 1110,
      uptimeSeconds: 432100,
    },
  ];

  private deployments: Map<string, BotDeployment> = new Map([
    [
      'dep-cold-001',
      {
        id: 'dep-cold-001',
        type: 'github_repo',
        name: 'NexusRaid-Sentinel',
        sourceUrl: 'https://github.com/sa1nt-dev/nexus-sentinel',
        framework: 'Discord.js v14',
        entrypoint: 'src/index.ts',
        envVariablesCount: 4,
        status: 'running',
        containerId: 'lxc-node-101',
        slotIndex: 1,
        submittedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        approvedAt: new Date(Date.now() - 86400000 * 3 + 300000).toISOString(),
        pipelineLogs: [
          { stage: 'Ingest', message: 'Repository verified and SHA256 hashed.', timestamp: '14:20:00' },
          { stage: 'Isolate', message: 'Docker cgroup v2 sandbox allocated.', timestamp: '14:20:12' },
          { stage: 'Pack', message: 'Assigned to slot [1/5] in lxc-node-101.', timestamp: '14:20:18' },
          { stage: 'Deploy', message: 'Process daemon initialized.', timestamp: '14:20:25' },
        ],
        telemetry: { cpuPercent: 1.2, memoryMb: 142, restarts: 0, uptime: '3d 4h 12m' },
      },
    ],
    [
      'dep-cold-002',
      {
        id: 'dep-cold-002',
        type: 'github_repo',
        name: 'Valkyrie-Audio-Worker',
        sourceUrl: 'https://github.com/valk-audio/core-engine',
        framework: 'Discord.py (Voice)',
        entrypoint: 'main.py',
        envVariablesCount: 3,
        status: 'running',
        containerId: 'lxc-node-101',
        slotIndex: 2,
        submittedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        approvedAt: new Date(Date.now() - 86400000 * 2 + 120000).toISOString(),
        pipelineLogs: [
          { stage: 'Ingest', message: 'Repo python dependencies resolved.', timestamp: '11:00:00' },
          { stage: 'Isolate', message: 'FFmpeg libopus container layer mapped.', timestamp: '11:00:15' },
          { stage: 'Pack', message: 'Assigned to slot [2/5] in lxc-node-101.', timestamp: '11:00:22' },
          { stage: 'Deploy', message: 'Voice gateway heartbeat verified.', timestamp: '11:00:30' },
        ],
        telemetry: { cpuPercent: 3.8, memoryMb: 280, restarts: 0, uptime: '2d 9h 01m' },
      },
    ],
    [
      'dep-cold-003',
      {
        id: 'dep-cold-003',
        type: 'ai_blueprint',
        name: 'AutoMod-Hardened-Guard',
        blueprintSummary: 'High-frequency spam & phishing filter with regex token inspection',
        framework: 'Node.js / Discord.js',
        slashCommands: [
          { name: '/scan', description: 'Scans last 100 messages for unverified links' },
          { name: '/lockdown', description: 'Restricts @everyone permissions during raid' },
        ],
        status: 'running',
        containerId: 'lxc-node-101',
        slotIndex: 3,
        submittedAt: new Date(Date.now() - 86400000).toISOString(),
        approvedAt: new Date(Date.now() - 86400000 + 45000).toISOString(),
        pipelineLogs: [
          { stage: 'Ingest', message: 'AI blueprint compiled into executable harness.', timestamp: '09:12:00' },
          { stage: 'Isolate', message: 'Restricted network outbound only.', timestamp: '09:12:08' },
          { stage: 'Pack', message: 'Assigned to slot [3/5] in lxc-node-101.', timestamp: '09:12:15' },
          { stage: 'Deploy', message: 'Slash command sync verified with Discord API.', timestamp: '09:12:22' },
        ],
        telemetry: { cpuPercent: 0.8, memoryMb: 98, restarts: 0, uptime: '1d 1h 45m' },
      },
    ],
    [
      'dep-cold-004',
      {
        id: 'dep-cold-004',
        type: 'github_repo',
        name: 'Pterodactyl-Relay',
        sourceUrl: 'https://github.com/sa1nt-dev/ptero-relay-bot',
        framework: 'Go / DiscordGo',
        entrypoint: 'cmd/bot/main.go',
        envVariablesCount: 5,
        status: 'running',
        containerId: 'lxc-node-101',
        slotIndex: 4,
        submittedAt: new Date(Date.now() - 72000000).toISOString(),
        approvedAt: new Date(Date.now() - 71900000).toISOString(),
        pipelineLogs: [
          { stage: 'Ingest', message: 'Go 1.23 static binary compiled in multi-stage Dockerfile.', timestamp: '18:00:00' },
          { stage: 'Isolate', message: 'Scratch image sandbox initialized.', timestamp: '18:00:10' },
          { stage: 'Pack', message: 'Assigned to slot [4/5] in lxc-node-101.', timestamp: '18:00:14' },
          { stage: 'Deploy', message: 'WebSocket tunnel established.', timestamp: '18:00:19' },
        ],
        telemetry: { cpuPercent: 0.4, memoryMb: 34, restarts: 0, uptime: '20h 15m' },
      },
    ],
    [
      'dep-cold-005',
      {
        id: 'dep-cold-005',
        type: 'github_repo',
        name: 'CronTicker-Notifier',
        sourceUrl: 'https://github.com/cron-bot/crypto-alert-bot',
        framework: 'Python 3.12 (AIOHTTP)',
        entrypoint: 'bot.py',
        envVariablesCount: 2,
        status: 'running',
        containerId: 'lxc-node-102',
        slotIndex: 1,
        submittedAt: new Date(Date.now() - 60000000).toISOString(),
        approvedAt: new Date(Date.now() - 59900000).toISOString(),
        pipelineLogs: [
          { stage: 'Ingest', message: 'Virtual environment instantiated.', timestamp: '04:00:00' },
          { stage: 'Isolate', message: 'Scoped non-root user execution configured.', timestamp: '04:00:05' },
          { stage: 'Pack', message: 'Assigned to slot [1/5] in lxc-node-102.', timestamp: '04:00:11' },
          { stage: 'Deploy', message: 'Cron timers activated.', timestamp: '04:00:16' },
        ],
        telemetry: { cpuPercent: 0.6, memoryMb: 112, restarts: 0, uptime: '16h 40m' },
      },
    ],
    [
      'dep-cold-006',
      {
        id: 'dep-cold-006',
        type: 'github_repo',
        name: 'Rust-LogIngester',
        sourceUrl: 'https://github.com/rust-infra/log-bot',
        framework: 'Rust (Serenity)',
        entrypoint: 'src/main.rs',
        envVariablesCount: 3,
        status: 'running',
        containerId: 'lxc-node-102',
        slotIndex: 2,
        submittedAt: new Date(Date.now() - 40000000).toISOString(),
        approvedAt: new Date(Date.now() - 39900000).toISOString(),
        pipelineLogs: [
          { stage: 'Ingest', message: 'Cargo release build verified.', timestamp: '10:00:00' },
          { stage: 'Isolate', message: 'Alpine base container generated.', timestamp: '10:00:12' },
          { stage: 'Pack', message: 'Assigned to slot [2/5] in lxc-node-102.', timestamp: '10:00:18' },
          { stage: 'Deploy', message: 'Subprocess running.', timestamp: '10:00:22' },
        ],
        telemetry: { cpuPercent: 0.3, memoryMb: 42, restarts: 0, uptime: '11h 05m' },
      },
    ],
    [
      'dep-cold-007',
      {
        id: 'dep-cold-007',
        type: 'ai_blueprint',
        name: 'Leveling-Leaderboard-AI',
        blueprintSummary: 'Gamified XP and voice-channel activity tracker with weekly badge rewards',
        framework: 'TypeScript / Discord.js',
        slashCommands: [
          { name: '/rank', description: 'Displays user XP card and rank in server' },
          { name: '/leaderboard', description: 'Lists top 10 most active members' },
        ],
        status: 'running',
        containerId: 'lxc-node-102',
        slotIndex: 3,
        submittedAt: new Date(Date.now() - 20000000).toISOString(),
        approvedAt: new Date(Date.now() - 19900000).toISOString(),
        pipelineLogs: [
          { stage: 'Ingest', message: 'Blueprint generated and validated.', timestamp: '15:30:00' },
          { stage: 'Isolate', message: 'Isolated SQLite storage volume mapped.', timestamp: '15:30:07' },
          { stage: 'Pack', message: 'Assigned to slot [3/5] in lxc-node-102.', timestamp: '15:30:14' },
          { stage: 'Deploy', message: 'Active and awaiting guild events.', timestamp: '15:30:20' },
        ],
        telemetry: { cpuPercent: 1.1, memoryMb: 130, restarts: 0, uptime: '5h 32m' },
      },
    ],
    // Pending deployment for immediate demonstration of the admin approval workflow
    [
      'dep-cold-008',
      {
        id: 'dep-cold-008',
        type: 'github_repo',
        name: 'TicketDispatcher-V2',
        sourceUrl: 'https://github.com/sa1nt-community/ticket-dispatcher',
        framework: 'Node.js / Discord.js',
        entrypoint: 'dist/index.js',
        envVariablesCount: 4,
        status: 'pending_approval',
        containerId: null,
        slotIndex: null,
        submittedAt: new Date(Date.now() - 1800000).toISOString(),
        pipelineLogs: [
          {
            stage: 'Ingest',
            message: 'Repository payload registered. Verification gate locked.',
            timestamp: new Date(Date.now() - 1800000).toLocaleTimeString(),
          },
          {
            stage: 'Gatekeeper',
            message: 'Awaiting admin signature at /api/admin/approve/dep-cold-008',
            timestamp: new Date(Date.now() - 1800000).toLocaleTimeString(),
          },
        ],
        telemetry: { cpuPercent: 0, memoryMb: 0, restarts: 0, uptime: '0s' },
      },
    ],
  ]);

  private capacityTriggerAlert: {
    active: boolean;
    message: string | null;
    triggeredAt: string | null;
  } = {
    active: false,
    message: null,
    triggeredAt: null,
  };

  /**
   * Retrieves live Proxmox node telemetry
   */
  public getProxmoxTelemetry(): ProxmoxNodeTelemetry {
    // Generate slight live jitter for authentic tactical telemetry dashboard feel
    const jitter = Math.sin(Date.now() / 10000) * 3;
    const cpu = Math.max(8, Math.min(65, 24.6 + jitter));
    const ramPercent = 48.2 + Math.cos(Date.now() / 15000) * 1.5;

    return {
      nodeName: 'pve-saint-coldsteel-01',
      status: this.capacityTriggerAlert.active ? 'DEGRADED' : 'ONLINE',
      cpuUtilizationPercent: parseFloat(cpu.toFixed(1)),
      ramUsagePercent: parseFloat(ramPercent.toFixed(1)),
      totalRamGb: 64,
      usedRamGb: parseFloat(((64 * ramPercent) / 100).toFixed(1)),
      nvmeReadMbps: parseFloat((145.4 + Math.random() * 20).toFixed(1)),
      nvmeWriteMbps: parseFloat((32.8 + Math.random() * 10).toFixed(1)),
      nodeTemperatureC: 43.5,
      pveVersion: 'Virtual Environment 8.2.4',
      kernelVersion: 'Linux 6.8.4-2-pve (x86_64)',
    };
  }

  /**
   * Summary of all cluster metrics
   */
  public getClusterStatus() {
    const runningBots = Array.from(this.deployments.values()).filter((d) => d.status === 'running');
    const pendingBots = Array.from(this.deployments.values()).filter((d) => d.status === 'pending_approval');
    const totalSlots = this.containers.length * 5;
    const remainingSlots = Math.max(0, totalSlots - runningBots.length);

    return {
      containers: this.containers,
      totalContainers: this.containers.length,
      totalSlots,
      activeBotsCount: runningBots.length,
      remainingSlots,
      pendingCount: pendingBots.length,
      capacityTrigger: this.capacityTriggerAlert,
      telemetry: this.getProxmoxTelemetry(),
    };
  }

  /**
   * Submits a public GitHub repository for automated deployment
   * Defaults to 'pending_approval'
   */
  public submitGitHubDeployment(data: {
    repoUrl: string;
    botName?: string;
    framework?: string;
    entrypoint?: string;
    envVariablesCount?: number;
  }): BotDeployment {
    const id = `dep-cold-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date();
    const timeStr = now.toLocaleTimeString();

    // Default bot name derived from repo URL
    const derivedName = data.botName?.trim() || data.repoUrl.split('/').pop()?.replace(/\.git$/, '') || 'Unnamed-Bot';

    const newDep: BotDeployment = {
      id,
      type: 'github_repo',
      name: derivedName,
      sourceUrl: data.repoUrl,
      framework: data.framework || 'Node.js / Discord.js',
      entrypoint: data.entrypoint || 'index.js',
      envVariablesCount: data.envVariablesCount || 0,
      status: 'pending_approval',
      containerId: null,
      slotIndex: null,
      submittedAt: now.toISOString(),
      pipelineLogs: [
        { stage: 'Ingest', message: `Target repository registered: ${data.repoUrl}`, timestamp: timeStr },
        { stage: 'Isolate', message: 'Container sandbox definition pre-compiled. Locked.', timestamp: timeStr },
        { stage: 'Gatekeeper', message: `Security hold: Bot '${derivedName}' awaiting admin approval at /api/admin/approve/${id}`, timestamp: timeStr },
      ],
      telemetry: { cpuPercent: 0, memoryMb: 0, restarts: 0, uptime: '0s' },
    };

    this.deployments.set(id, newDep);
    return newDep;
  }

  /**
   * Submits an AI Bot Blueprint
   * Defaults to 'pending_approval'
   */
  public submitBotBlueprint(data: {
    botName: string;
    framework: string;
    scopeSummary: string;
    slashCommands: SlashCommandDef[];
    databaseRequirement?: string;
  }): BotDeployment {
    const id = `bp-cold-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date();
    const timeStr = now.toLocaleTimeString();

    const newDep: BotDeployment = {
      id,
      type: 'ai_blueprint',
      name: data.botName,
      blueprintSummary: data.scopeSummary,
      framework: data.framework,
      slashCommands: data.slashCommands,
      status: 'pending_approval',
      containerId: null,
      slotIndex: null,
      submittedAt: now.toISOString(),
      pipelineLogs: [
        { stage: 'Ingest', message: `AI Blueprint registered: ${data.slashCommands.length} slash commands defined.`, timestamp: timeStr },
        { stage: 'Synthesize', message: 'Logic blueprint validated against Saint architectural standards.', timestamp: timeStr },
        { stage: 'Gatekeeper', message: `Pending admin review and execution clearance at /api/admin/approve/${id}`, timestamp: timeStr },
      ],
      telemetry: { cpuPercent: 0, memoryMb: 0, restarts: 0, uptime: '0s' },
    };

    this.deployments.set(id, newDep);
    return newDep;
  }

  /**
   * Admin Approval Gate & Proxmox Capacity Trigger
   * Hard Physical Ceiling: exactly 5 bots per container.
   * Capacity Trigger: At multiples of 5 (e.g. 5th, 10th, 15th overall) when all existing virtual environments are maxed out.
   */
  public approveDeployment(id: string): {
    success: boolean;
    deployment?: BotDeployment;
    error?: string;
    capacityAlertTriggered?: boolean;
    message: string;
  } {
    const dep = this.deployments.get(id);
    if (!dep) {
      return { success: false, error: 'DEPLOYMENT_NOT_FOUND', message: `No deployment found with ID '${id}'` };
    }

    if (dep.status === 'running') {
      return { success: true, deployment: dep, message: 'Deployment is already running.' };
    }

    // Calculate current running bots count
    const currentlyRunning = Array.from(this.deployments.values()).filter((d) => d.status === 'running').length;
    const nextRunningCount = currentlyRunning + 1;

    // Check available open slots in active containers
    const availableContainer = this.containers.find((c) => c.status === 'active' && c.allocatedBots.length < 5);

    // Evaluate Capacity Trigger:
    // If the new approved bot pushes the active queue to a multiple of 5 (e.g. 10th, 15th) AND all existing virtual environments are maxed out
    const isMultipleOfFive = nextRunningCount % 5 === 0;
    const allContainersFull = !availableContainer;

    if (allContainersFull || (isMultipleOfFive && !availableContainer)) {
      // Trigger the stark crimson alert!
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

    // Allocate to available container
    const targetContainer = availableContainer;
    targetContainer.allocatedBots.push(dep.id);
    const assignedSlot = targetContainer.allocatedBots.length;

    if (targetContainer.allocatedBots.length >= 5) {
      targetContainer.status = 'packed_full';
    }

    const now = new Date();
    dep.status = 'running';
    dep.containerId = targetContainer.id;
    dep.slotIndex = assignedSlot;
    dep.approvedAt = now.toISOString();

    // Log the 4-stage pipeline execution
    dep.pipelineLogs.push(
      { stage: 'Ingest', message: 'Admin signature authenticated. Code ingest initiated.', timestamp: now.toLocaleTimeString() },
      { stage: 'Isolate', message: 'Isolated cgroup v2 sandbox spawned with memory hardcap 512MB.', timestamp: now.toLocaleTimeString() },
      {
        stage: 'Pack',
        message: `Packed into ${targetContainer.label} (${targetContainer.id}) -> Slot [${assignedSlot}/5].`,
        timestamp: now.toLocaleTimeString(),
      },
      { stage: 'Deploy', message: 'Container active inside Proxmox cluster. Process healthy.', timestamp: now.toLocaleTimeString() }
    );

    dep.telemetry = {
      cpuPercent: parseFloat((0.4 + Math.random() * 2).toFixed(1)),
      memoryMb: Math.floor(64 + Math.random() * 150),
      restarts: 0,
      uptime: '1m',
    };

    // If after this allocation, all containers happen to hit a multiple of 5 and zero slots remain, flag capacity
    const updatedRunningCount = Array.from(this.deployments.values()).filter((d) => d.status === 'running').length;
    const hasRemainingSlots = this.containers.some((c) => c.allocatedBots.length < 5);
    if (updatedRunningCount % 5 === 0 && !hasRemainingSlots) {
      this.capacityTriggerAlert = {
        active: true,
        message:
          '[CRITICAL] CLUSTER CAPACITY REACHED. PROMPT: Manually provision an additional Proxmox VM node or spin up a new global cluster element to accept further deployments.',
        triggeredAt: new Date().toISOString(),
      };
    }

    return {
      success: true,
      deployment: dep,
      message: `Deployment ${dep.id} (${dep.name}) approved and packed into ${targetContainer.label} [Slot ${assignedSlot}/5].`,
    };
  }

  /**
   * Admin Rejection
   */
  public rejectDeployment(id: string, reason: string): { success: boolean; deployment?: BotDeployment; message: string } {
    const dep = this.deployments.get(id);
    if (!dep) {
      return { success: false, message: `No deployment found with ID '${id}'` };
    }

    dep.status = 'rejected';
    dep.rejectionReason = reason || 'Admin discretion: Repository does not meet Cold Steel security standards.';
    dep.pipelineLogs.push({
      stage: 'Rejection',
      message: `Admin rejected: ${dep.rejectionReason}`,
      timestamp: new Date().toLocaleTimeString(),
    });

    return { success: true, deployment: dep, message: `Deployment ${dep.id} rejected.` };
  }

  /**
   * Manually provision a new Proxmox VM / LXC container
   * Expands cluster by 5 slots and clears capacity alert
   */
  public provisionProxmoxNode(label?: string): ClusterContainer {
    const nextVmid = 100 + this.containers.length + 1;
    const nodeLabel = label?.trim() || `SAINT-POD-${String.fromCharCode(65 + this.containers.length)}`;
    const newContainer: ClusterContainer = {
      id: `lxc-node-${nextVmid}`,
      label: nodeLabel,
      vmid: nextVmid,
      nodeHost: 'pve-saint-01',
      status: 'active',
      allocatedBots: [],
      maxBots: 5,
      cpuCores: 2,
      allocatedMemoryMb: 2048,
      usedMemoryMb: 256,
      uptimeSeconds: 0,
    };

    this.containers.push(newContainer);

    // Clear capacity alert
    this.capacityTriggerAlert = {
      active: false,
      message: null,
      triggeredAt: null,
    };

    return newContainer;
  }

  /**
   * Get all deployments (optionally filter by status)
   */
  public getAllDeployments(status?: DeploymentStatus): BotDeployment[] {
    const list = Array.from(this.deployments.values());
    if (status) {
      return list.filter((d) => d.status === status);
    }
    return list.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  }

  /**
   * Get single deployment
   */
  public getDeploymentById(id: string): BotDeployment | undefined {
    return this.deployments.get(id);
  }
}

export const orchestrationEngine = new OrchestrationEngine();
