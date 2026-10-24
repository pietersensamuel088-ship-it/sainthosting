import https from 'https';
import { config } from '../config.js';

export interface ProxmoxNodeStatusResponse {
  cpu: number; // 0 to 1
  memory: {
    total: number;
    used: number;
    free: number;
  };
  uptime: number;
  pveversion: string;
  kversion: string;
  rootfs: {
    total: number;
    used: number;
    free: number;
  };
}

export class ProxmoxClient {
  private agent: https.Agent;

  constructor() {
    // Proxmox typically uses self-signed SSL certificates for LAN IPs (e.g. 192.168.x.x)
    this.agent = new https.Agent({
      rejectUnauthorized: false,
    });
  }

  /**
   * Tests connection to Proxmox VE API using API Token
   * Format of tokenId: 'user@pam!tokenname'
   * Format of tokenSecret: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
   */
  public async testConnection(params: {
    host: string;
    port?: number;
    tokenId: string;
    tokenSecret: string;
    nodeName?: string;
  }): Promise<{ success: boolean; message: string; version?: string; nodeStatus?: any }> {
    const { host, port = 8006, tokenId, tokenSecret, nodeName = 'pve' } = params;

    if (!host || !tokenId || !tokenSecret) {
      return {
        success: false,
        message: 'Host, API Token ID, and Token Secret are all required.',
      };
    }

    // Clean host URL (strip trailing slash and protocol if provided)
    let cleanHost = host.trim().replace(/\/$/, '');
    if (!cleanHost.startsWith('http://') && !cleanHost.startsWith('https://')) {
      cleanHost = `https://${cleanHost}:${port}`;
    } else if (!cleanHost.includes(':', 7)) {
      cleanHost = `${cleanHost}:${port}`;
    }

    const authHeader = `PVEAPIToken=${tokenId}=${tokenSecret}`;

    try {
      // 1. Query Proxmox VE Version
      const versionRes = await fetch(`${cleanHost}/api2/json/version`, {
        method: 'GET',
        headers: {
          Authorization: authHeader,
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(6000),
      });

      if (!versionRes.ok) {
        const text = await versionRes.text();
        return {
          success: false,
          message: `Proxmox API returned status ${versionRes.status}: ${text || versionRes.statusText}. Check Token permissions in PVE.`,
        };
      }

      const versionData: any = await versionRes.json();
      const pveRelease = versionData?.data?.release || 'Proxmox VE';

      // 2. Query Target Node Status
      let nodeData = null;
      try {
        const nodeRes = await fetch(`${cleanHost}/api2/json/nodes/${nodeName}/status`, {
          method: 'GET',
          headers: {
            Authorization: authHeader,
            Accept: 'application/json',
          },
          signal: AbortSignal.timeout(6000),
        });
        if (nodeRes.ok) {
          const json: any = await nodeRes.json();
          nodeData = json.data;
        }
      } catch {
        // Node query optional on first test
      }

      return {
        success: true,
        message: `Successfully connected to Proxmox VE (${pveRelease}).`,
        version: `${pveRelease} v${versionData?.data?.version || '8.x'}`,
        nodeStatus: nodeData,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Connection failed: ${err.message}. Make sure your Proxmox server IP and port 8006 are reachable on your network.`,
      };
    }
  }

  /**
   * Fetches real node metrics if configured
   */
  public async fetchRealNodeStatus(): Promise<ProxmoxNodeStatusResponse | null> {
    const { host, port = 8006, tokenId, tokenSecret, nodeName } = config.proxmox;
    if (!host || !tokenId || !tokenSecret) return null;

    let cleanHost = host.trim().replace(/\/$/, '');
    if (!cleanHost.startsWith('http://') && !cleanHost.startsWith('https://')) {
      cleanHost = `https://${cleanHost}:${port}`;
    }

    try {
      const res = await fetch(`${cleanHost}/api2/json/nodes/${nodeName}/status`, {
        method: 'GET',
        headers: {
          Authorization: `PVEAPIToken=${tokenId}=${tokenSecret}`,
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(5000),
      });

      if (res.ok) {
        const json: any = await res.json();
        return json.data as ProxmoxNodeStatusResponse;
      }
      return null;
    } catch {
      return null;
    }
  }
}

export const proxmoxClient = new ProxmoxClient();
