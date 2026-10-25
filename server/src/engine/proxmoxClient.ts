import https from 'https';
import http from 'http';
import { URL } from 'url';
import { config } from '../config.js';

export interface ProxmoxNodeStatusResponse {
  cpu: number; // 0 to 1
  cpuinfo?: {
    cores: number;
    cpus: number;
    model: string;
    mhz?: string;
  };
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

/**
 * Normalizes any user-entered Proxmox host into a clean, valid URL without duplicate ports.
 * Handles:
 *   - 192.168.18.212
 *   - 192.168.18.212:8006
 *   - https://192.168.18.212:8006
 *   - https://192.168.18.212:8006/
 *   - http://pve.local:8006
 */
export function normalizeProxmoxUrl(rawHost: string, defaultPort: number | string = 8006): string {
  let host = (rawHost || '').trim().replace(/\/+$/, '');
  const port = parseInt(defaultPort.toString(), 10) || 8006;

  let protocol = 'https:';
  if (host.startsWith('http://')) {
    protocol = 'http:';
    host = host.slice(7);
  } else if (host.startsWith('https://')) {
    protocol = 'https:';
    host = host.slice(8);
  }

  // Strip any trailing path if user pasted /api2/...
  host = host.split('/')[0];

  // If port is already present in host string (e.g. 192.168.18.212:8006)
  if (host.includes(':')) {
    return `${protocol}//${host}`;
  }

  return `${protocol}//${host}:${port}`;
}

/**
 * Sends an HTTP/HTTPS request to Proxmox VE API, automatically trusting
 * self-signed certificates on local network IPs (e.g. 192.168.x.x).
 */
function pveRequest(
  urlStr: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    timeoutMs?: number;
    body?: string;
  }
) {
  return new Promise<{ ok: boolean; status: number; statusText: string; json: () => Promise<any>; text: () => Promise<string> }>((resolve, reject) => {
    try {
      const parsedUrl = new URL(urlStr);
      const isHttps = parsedUrl.protocol === 'https:';
      const lib = isHttps ? https : http;

      const headers = { ...(options.headers || {}) };
      if (options.body && !headers['Content-Length']) {
        headers['Content-Length'] = Buffer.byteLength(options.body).toString();
      }

      const req = lib.request(
        parsedUrl,
        {
          method: options.method || 'GET',
          headers,
          rejectUnauthorized: false, // Explicitly permit self-signed PVE certificates
          timeout: options.timeoutMs || 8000,
        },
        (res) => {
          const chunks: Buffer[] = [];
          res.on('data', (chunk) => chunks.push(chunk));
          res.on('end', () => {
            const body = Buffer.concat(chunks).toString('utf-8');
            resolve({
              ok: (res.statusCode || 0) >= 200 && (res.statusCode || 0) < 300,
              status: res.statusCode || 500,
              statusText: res.statusMessage || '',
              text: async () => body,
              json: async () => JSON.parse(body),
            });
          });
        }
      );

      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`Connection timed out after ${(options.timeoutMs || 8000) / 1000}s. Verify Proxmox host IP and port 8006.`));
      });

      req.on('error', (err: any) => {
        reject(err);
      });

      if (options.body) {
        req.write(options.body);
      }
      req.end();
    } catch (err: any) {
      reject(new Error(`Failed to parse URL from ${urlStr}: ${err.message}`));
    }
  });
}

export class ProxmoxClient {
  /**
   * Tests connection to Proxmox VE API using API Token
   * Format of tokenId: 'user@pam!tokenname'
   * Format of tokenSecret: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
   */
  public async testConnection(params: {
    host: string;
    port?: number | string;
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

    const cleanHost = normalizeProxmoxUrl(host, port);
    const authHeader = `PVEAPIToken=${tokenId.trim()}=${tokenSecret.trim()}`;

    try {
      // 1. Query Proxmox VE Version
      const versionRes = await pveRequest(`${cleanHost}/api2/json/version`, {
        method: 'GET',
        headers: {
          Authorization: authHeader,
          Accept: 'application/json',
        },
        timeoutMs: 7000,
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
      const pveVersion = versionData?.data?.version || '8.x';

      // 2. Query Target Node Status
      let nodeData = null;
      try {
        const nodeRes = await pveRequest(`${cleanHost}/api2/json/nodes/${nodeName.trim()}/status`, {
          method: 'GET',
          headers: {
            Authorization: authHeader,
            Accept: 'application/json',
          },
          timeoutMs: 5000,
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
        version: `${pveRelease} v${pveVersion}`,
        nodeStatus: nodeData,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Connection failed: ${err.message}. Make sure your Proxmox server IP (${cleanHost}) is reachable.`,
      };
    }
  }

  /**
   * Fetches real node metrics if configured
   */
  public async fetchRealNodeStatus(): Promise<ProxmoxNodeStatusResponse | null> {
    const { host, port = 8006, tokenId, tokenSecret, nodeName } = config.proxmox;
    if (!host || !tokenId || !tokenSecret) return null;

    const cleanHost = normalizeProxmoxUrl(host, port);

    try {
      const res = await pveRequest(`${cleanHost}/api2/json/nodes/${nodeName}/status`, {
        method: 'GET',
        headers: {
          Authorization: `PVEAPIToken=${tokenId}=${tokenSecret}`,
          Accept: 'application/json',
        },
        timeoutMs: 5000,
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

  /**
   * Returns next safe VMID, enforcing dedicated 900+ series to avoid collisions with personal VMs
   */
  public async getNextSafeVmid(): Promise<number> {
    const { host, port = 8006, tokenId, tokenSecret } = config.proxmox;
    if (!host || !tokenId || !tokenSecret) return 901;

    const cleanHost = normalizeProxmoxUrl(host, port);
    try {
      const res = await pveRequest(`${cleanHost}/api2/json/cluster/nextid`, {
        method: 'GET',
        headers: {
          Authorization: `PVEAPIToken=${tokenId}=${tokenSecret}`,
          Accept: 'application/json',
        },
        timeoutMs: 4000,
      });

      if (res.ok) {
        const json: any = await res.json();
        const pveNext = parseInt(json.data || '100', 10);
        return Math.max(901, pveNext);
      }
      return 901;
    } catch {
      return 901;
    }
  }

  /**
   * Provisions a dedicated unprivileged LXC Container on Proxmox VE
   */
  public async createLxcContainer(params: {
    vmid?: number;
    hostname: string;
    cores?: number;
    memoryMb?: number;
    diskGb?: number;
    template?: string;
  }): Promise<{ success: boolean; vmid: number; message: string; taskId?: string }> {
    const { host, port = 8006, tokenId, tokenSecret, nodeName } = config.proxmox;
    if (!host || !tokenId || !tokenSecret) {
      return {
        success: false,
        vmid: 901,
        message: 'Proxmox API credentials not configured in .env',
      };
    }

    const cleanHost = normalizeProxmoxUrl(host, port);
    const vmid = params.vmid || (await this.getNextSafeVmid());
    const cores = params.cores || 2;
    const memory = params.memoryMb || 1024;
    const disk = params.diskGb || 8;
    const hostname = params.hostname || `saint-pod-${vmid}`;
    const ostemplate = params.template || 'local:vztmpl/debian-12-standard_12.12-1_amd64.tar.zst';

    try {
      const postData = new URLSearchParams({
        vmid: vmid.toString(),
        ostemplate,
        hostname,
        cores: cores.toString(),
        memory: memory.toString(),
        swap: '512',
        rootfs: `local-lvm:${disk}`,
        net0: 'name=eth0,bridge=vmbr0,ip=dhcp',
        unprivileged: '1',
        start: '1',
        description: 'Saint // Cold Steel Bot Pod (Capacity: 5 Bots, 1GB quota per bot slot)',
      }).toString();

      const res = await pveRequest(`${cleanHost}/api2/json/nodes/${nodeName}/lxc`, {
        method: 'POST',
        headers: {
          Authorization: `PVEAPIToken=${tokenId}=${tokenSecret}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: postData,
        timeoutMs: 15000,
      });

      const json: any = await res.json();
      if (!res.ok) {
        return {
          success: false,
          vmid,
          message: `Proxmox returned error: ${json.message || res.statusText}`,
        };
      }

      return {
        success: true,
        vmid,
        taskId: json.data,
        message: `LXC Container Pod ${vmid} ('${hostname}') provisioned successfully on Proxmox node '${nodeName}'.`,
      };
    } catch (err: any) {
      return {
        success: false,
        vmid,
        message: `Failed to create LXC container on Proxmox: ${err.message}`,
      };
    }
  }
}

export const proxmoxClient = new ProxmoxClient();
