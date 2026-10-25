import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface SlashCommandDef {
  name: string;
  description: string;
  parameters?: string;
  ephemeral?: boolean;
}

export interface BotDeployment {
  id: string;
  type: 'github_repo' | 'ai_blueprint';
  name: string;
  sourceUrl?: string;
  blueprintSummary?: string;
  framework: string;
  entrypoint?: string;
  envVariablesCount?: number;
  slashCommands?: SlashCommandDef[];
  status: 'pending_approval' | 'approved' | 'rejected' | 'building' | 'running';
  containerId: string | null;
  slotIndex: number | null;
  subdomainConsoleUrl?: string;
  discordApp?: {
    id: string;
    username: string;
    avatarUrl: string;
    inviteUrl: string;
    maskedToken: string;
  };
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
  nodeHost: string;
  status: 'active' | 'packed_full' | 'provisioning' | 'offline';
  allocatedBots: string[];
  maxBots: 5;
  cpuCores: number;
  allocatedMemoryMb: number;
  uptimeSeconds: number;
}

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
    status: 'CONNECTED & RUNNING' | 'DISCONNECTED' | 'UNDER MAINTENANCE' | 'STANDBY_AWAITING_CONFIG' | string;
    notice: string;
  };
}

export interface CapacityAlertState {
  active: boolean;
  message: string | null;
  triggeredAt: string | null;
}

export interface ClusterData {
  containers: ClusterContainer[];
  totalContainers: number;
  totalSlots: number;
  activeBotsCount: number;
  remainingSlots: number;
  pendingCount: number;
  capacityTrigger: CapacityAlertState;
  telemetry: RealSystemTelemetry;
}

interface ClusterContextType {
  cluster: ClusterData | null;
  deployments: BotDeployment[];
  loading: boolean;
  isAdmin: boolean;
  adminUser: any | null;
  refreshCluster: () => Promise<void>;
  loginAdmin: (password: string) => Promise<{ success: boolean; message: string }>;
  logoutAdmin: () => Promise<void>;
  approveDeployment: (id: string) => Promise<{ success: boolean; message: string; capacityAlert?: boolean }>;
  rejectDeployment: (id: string, reason: string) => Promise<{ success: boolean; message: string }>;
  provisionNode: (label?: string, cores?: number, memoryMb?: number) => Promise<{ success: boolean; message: string }>;
  destroyNode: (id: string) => Promise<{ success: boolean; message: string }>;
  deleteDeployment: (id: string) => Promise<{ success: boolean; message: string }>;
}

const ClusterContext = createContext<ClusterContextType | undefined>(undefined);

export const ClusterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cluster, setCluster] = useState<ClusterData | null>(null);
  const [deployments, setDeployments] = useState<BotDeployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminUser, setAdminUser] = useState<any | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/cluster/status');
      if (res.ok) {
        const json = await res.json();
        setCluster(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch cluster status:', err);
    }
  };

  const fetchDeployments = async () => {
    try {
      const res = await fetch('/api/admin/deployments', { credentials: 'include' });
      if (res.ok) {
        const json = await res.json();
        setDeployments(json.deployments || []);
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    } catch (err) {
      setIsAdmin(false);
    }
  };

  const refreshCluster = async () => {
    await fetchStatus();
    if (isAdmin) {
      await fetchDeployments();
    }
    setLoading(false);
  };

  useEffect(() => {
    refreshCluster();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const loginAdmin = async (password: string) => {
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsAdmin(true);
        setAdminUser(data.admin);
        await fetchDeployments();
        await fetchStatus();
        return { success: true, message: data.message };
      }
      return { success: false, message: data.message || 'Login failed.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error.' };
    }
  };

  const logoutAdmin = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST', credentials: 'include' });
      setIsAdmin(false);
      setAdminUser(null);
      setDeployments([]);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const approveDeployment = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/approve/${id}`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      await fetchStatus();
      await fetchDeployments();
      return {
        success: data.success,
        message: data.message,
        capacityAlert: data.capacityAlertTriggered,
      };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  };

  const rejectDeployment = async (id: string, reason: string) => {
    try {
      const res = await fetch(`/api/admin/reject/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      await fetchStatus();
      await fetchDeployments();
      return { success: data.success, message: data.message };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  };

  const provisionNode = async (label?: string, cores: number = 1, memoryMb: number = 1024) => {
    try {
      const res = await fetch('/api/admin/provision-node', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ label, cores, memoryMb }),
      });
      const data = await res.json();
      await fetchStatus();
      await fetchDeployments();
      return { success: data.success, message: data.message };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  };

  const destroyNode = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/containers/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      await fetchStatus();
      await fetchDeployments();
      return { success: data.success, message: data.message };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  };

  const deleteDeployment = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/deployments/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      await fetchStatus();
      await fetchDeployments();
      return { success: data.success, message: data.message };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  };

  return (
    <ClusterContext.Provider
      value={{
        cluster,
        deployments,
        loading,
        isAdmin,
        adminUser,
        refreshCluster,
        loginAdmin,
        logoutAdmin,
        approveDeployment,
        rejectDeployment,
        provisionNode,
        destroyNode,
        deleteDeployment,
      }}
    >
      {children}
    </ClusterContext.Provider>
  );
};

export const useCluster = () => {
  const context = useContext(ClusterContext);
  if (!context) {
    throw new Error('useCluster must be used within a ClusterProvider');
  }
  return context;
};
