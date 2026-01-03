import type { ProxmuxConfig } from "../config/index.ts";
import type {
  ProxmoxResponse,
  Node,
  VM,
  VMConfig,
  Container,
  ContainerConfig,
  Storage,
  Task,
  ResourceSummary,
  NetworkInterface,
  Template,
  AvailableTemplate,
  LXCCreateConfig,
  StorageContent,
} from "./types.ts";

export class ProxmoxClient {
  private baseUrl: string;
  private authHeader: string;

  constructor(config: ProxmuxConfig) {
    this.baseUrl = config.host.replace(/\/$/, "");
    this.authHeader = `PVEAPIToken=${config.user}!${config.tokenId}=${config.tokenSecret}`;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: Record<string, unknown>
  ): Promise<T> {
    const url = `${this.baseUrl}/api2/json${path}`;

    const headers: Record<string, string> = {
      Authorization: this.authHeader,
    };

    const options: RequestInit = {
      method,
      headers,
      // Skip SSL verification for self-signed certs (common in Proxmox)
      // @ts-expect-error - Bun supports this option
      tls: {
        rejectUnauthorized: false,
      },
    };

    if (body) {
      // Proxmox expects form-urlencoded for POST/PUT
      headers["Content-Type"] = "application/x-www-form-urlencoded";
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(body)) {
        params.append(key, String(value));
      }
      options.body = params.toString();
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const text = await response.text();
      if (response.status === 401) {
        throw new Error(
          `Authentication failed (401). Check your API token:\n` +
          `  - User format: user@realm (e.g., root@pam)\n` +
          `  - Token ID: just the name (e.g., proxmux)\n` +
          `  - Ensure "Privilege Separation" is unchecked in Proxmox`
        );
      }
      if (response.status === 501) {
        throw new Error(`Operation not supported (501)`);
      }
      throw new Error(`Proxmox API error: ${response.status} - ${text}`);
    }

    const json = (await response.json()) as ProxmoxResponse<T>;
    return json.data;
  }

  // Connection test
  async testConnection(): Promise<boolean> {
    try {
      await this.request<unknown>("GET", "/version");
      return true;
    } catch {
      return false;
    }
  }

  // Node operations
  async getNodes(): Promise<Node[]> {
    return this.request<Node[]>("GET", "/nodes");
  }

  async getNodeStatus(node: string): Promise<Node> {
    return this.request<Node>("GET", `/nodes/${node}/status`);
  }

  // VM operations
  async getVMs(node?: string): Promise<VM[]> {
    if (node) {
      return this.request<VM[]>("GET", `/nodes/${node}/qemu`);
    }

    // Get VMs from all nodes
    const nodes = await this.getNodes();
    const vmPromises = nodes.map((n) =>
      this.request<VM[]>("GET", `/nodes/${n.node}/qemu`).then((vms) =>
        vms.map((vm) => ({ ...vm, node: n.node }))
      )
    );

    const results = await Promise.all(vmPromises);
    return results.flat();
  }

  async getVM(node: string, vmid: number): Promise<VM> {
    const vms = await this.request<VM[]>("GET", `/nodes/${node}/qemu`);
    const vm = vms.find((v) => v.vmid === vmid);
    if (!vm) {
      throw new Error(`VM ${vmid} not found on node ${node}`);
    }
    return { ...vm, node };
  }

  async startVM(node: string, vmid: number): Promise<string> {
    return this.request<string>("POST", `/nodes/${node}/qemu/${vmid}/status/start`);
  }

  async stopVM(node: string, vmid: number): Promise<string> {
    return this.request<string>("POST", `/nodes/${node}/qemu/${vmid}/status/stop`);
  }

  async shutdownVM(node: string, vmid: number): Promise<string> {
    return this.request<string>("POST", `/nodes/${node}/qemu/${vmid}/status/shutdown`);
  }

  async rebootVM(node: string, vmid: number): Promise<string> {
    return this.request<string>("POST", `/nodes/${node}/qemu/${vmid}/status/reboot`);
  }

  async getVMConfig(node: string, vmid: number): Promise<VMConfig> {
    return this.request<VMConfig>("GET", `/nodes/${node}/qemu/${vmid}/config`);
  }

  // Container operations
  async getContainers(node?: string): Promise<Container[]> {
    if (node) {
      return this.request<Container[]>("GET", `/nodes/${node}/lxc`);
    }

    // Get containers from all nodes
    const nodes = await this.getNodes();
    const containerPromises = nodes.map((n) =>
      this.request<Container[]>("GET", `/nodes/${n.node}/lxc`).then((containers) =>
        containers.map((c) => ({ ...c, node: n.node }))
      )
    );

    const results = await Promise.all(containerPromises);
    return results.flat();
  }

  async getContainer(node: string, vmid: number): Promise<Container> {
    const containers = await this.request<Container[]>("GET", `/nodes/${node}/lxc`);
    const container = containers.find((c) => c.vmid === vmid);
    if (!container) {
      throw new Error(`Container ${vmid} not found on node ${node}`);
    }
    return { ...container, node };
  }

  async startContainer(node: string, vmid: number): Promise<string> {
    return this.request<string>("POST", `/nodes/${node}/lxc/${vmid}/status/start`);
  }

  async stopContainer(node: string, vmid: number): Promise<string> {
    return this.request<string>("POST", `/nodes/${node}/lxc/${vmid}/status/stop`);
  }

  async shutdownContainer(node: string, vmid: number): Promise<string> {
    return this.request<string>("POST", `/nodes/${node}/lxc/${vmid}/status/shutdown`);
  }

  async rebootContainer(node: string, vmid: number): Promise<string> {
    return this.request<string>("POST", `/nodes/${node}/lxc/${vmid}/status/reboot`);
  }

  async getContainerConfig(node: string, vmid: number): Promise<ContainerConfig> {
    return this.request<ContainerConfig>("GET", `/nodes/${node}/lxc/${vmid}/config`);
  }

  async getContainerInterfaces(node: string, vmid: number): Promise<NetworkInterface[]> {
    return this.request<NetworkInterface[]>("GET", `/nodes/${node}/lxc/${vmid}/interfaces`);
  }

  // LXC Creation operations

  /**
   * Get the next available VMID from the cluster
   */
  async getNextVMID(): Promise<number> {
    const result = await this.request<string>("GET", "/cluster/nextid");
    return parseInt(result, 10);
  }

  /**
   * Get local templates stored on a specific storage
   */
  async getTemplates(node: string, storage: string): Promise<StorageContent[]> {
    const contents = await this.request<StorageContent[]>(
      "GET",
      `/nodes/${node}/storage/${storage}/content?content=vztmpl`
    );
    return contents.filter((c) => c.content === "vztmpl");
  }

  /**
   * Get all local templates from all storages on a node
   */
  async getAllTemplates(node: string): Promise<StorageContent[]> {
    const storages = await this.request<Storage[]>("GET", `/nodes/${node}/storage`);
    const templateStorages = storages.filter(
      (s) => s.content.includes("vztmpl") && s.active === 1
    );

    const templatePromises = templateStorages.map((s) =>
      this.getTemplates(node, s.storage).catch(() => [] as StorageContent[])
    );

    const results = await Promise.all(templatePromises);
    return results.flat();
  }

  /**
   * Get available templates from Proxmox repository (aplinfo)
   */
  async getAvailableTemplates(node: string): Promise<AvailableTemplate[]> {
    return this.request<AvailableTemplate[]>("GET", `/nodes/${node}/aplinfo`);
  }

  /**
   * Download a template from the Proxmox repository
   * Returns a task UPID to track progress
   */
  async downloadTemplate(
    node: string,
    storage: string,
    template: string
  ): Promise<string> {
    return this.request<string>("POST", `/nodes/${node}/aplinfo`, {
      storage,
      template,
    });
  }

  /**
   * Get storages that can hold container templates
   */
  async getTemplateStorages(node: string): Promise<Storage[]> {
    const storages = await this.request<Storage[]>("GET", `/nodes/${node}/storage`);
    return storages.filter(
      (s) => s.content.includes("vztmpl") && s.active === 1 && s.enabled === 1
    );
  }

  /**
   * Get storages that can hold container root filesystems
   */
  async getRootfsStorages(node: string): Promise<Storage[]> {
    const storages = await this.request<Storage[]>("GET", `/nodes/${node}/storage`);
    return storages.filter(
      (s) => s.content.includes("rootdir") && s.active === 1 && s.enabled === 1
    );
  }

  /**
   * Get network bridges available on a node
   */
  async getNetworkBridges(node: string): Promise<{ iface: string; type: string; active: number }[]> {
    const networks = await this.request<{ iface: string; type: string; active: number }[]>(
      "GET",
      `/nodes/${node}/network`
    );
    return networks.filter((n) => n.type === "bridge" && n.active === 1);
  }

  /**
   * Create a new LXC container
   * Returns a task UPID to track progress
   */
  async createContainer(node: string, config: LXCCreateConfig): Promise<string> {
    // Convert boolean values to 0/1 for Proxmox API
    const apiConfig: Record<string, unknown> = {
      vmid: config.vmid,
      hostname: config.hostname,
      ostemplate: config.ostemplate,
      rootfs: config.rootfs,
    };

    if (config.password) {
      apiConfig.password = config.password;
    }
    if (config["ssh-public-keys"]) {
      apiConfig["ssh-public-keys"] = config["ssh-public-keys"];
    }
    if (config.cores !== undefined) {
      apiConfig.cores = config.cores;
    }
    if (config.memory !== undefined) {
      apiConfig.memory = config.memory;
    }
    if (config.swap !== undefined) {
      apiConfig.swap = config.swap;
    }
    if (config.net0) {
      apiConfig.net0 = config.net0;
    }
    if (config.nameserver) {
      apiConfig.nameserver = config.nameserver;
    }
    if (config.searchdomain) {
      apiConfig.searchdomain = config.searchdomain;
    }
    if (config.unprivileged !== undefined) {
      apiConfig.unprivileged = config.unprivileged ? 1 : 0;
    }
    if (config.start !== undefined) {
      apiConfig.start = config.start ? 1 : 0;
    }
    if (config.features) {
      apiConfig.features = config.features;
    }
    if (config.onboot !== undefined) {
      apiConfig.onboot = config.onboot ? 1 : 0;
    }

    return this.request<string>("POST", `/nodes/${node}/lxc`, apiConfig);
  }

  // Storage operations
  async getStorage(node?: string): Promise<Storage[]> {
    if (node) {
      return this.request<Storage[]>("GET", `/nodes/${node}/storage`);
    }

    const nodes = await this.getNodes();
    const storagePromises = nodes.map((n) =>
      this.request<Storage[]>("GET", `/nodes/${n.node}/storage`)
    );

    const results = await Promise.all(storagePromises);
    // Deduplicate shared storage
    const seen = new Set<string>();
    return results.flat().filter((s) => {
      if (seen.has(s.storage)) return false;
      seen.add(s.storage);
      return true;
    });
  }

  // Cluster resources
  async getResources(): Promise<ResourceSummary[]> {
    return this.request<ResourceSummary[]>("GET", "/cluster/resources");
  }

  // Tasks
  async getTasks(node: string): Promise<Task[]> {
    return this.request<Task[]>("GET", `/nodes/${node}/tasks`);
  }

  async getTaskStatus(node: string, upid: string): Promise<Task> {
    return this.request<Task>("GET", `/nodes/${node}/tasks/${encodeURIComponent(upid)}/status`);
  }
}

// Singleton instance
let client: ProxmoxClient | null = null;

export function initClient(config: ProxmuxConfig): ProxmoxClient {
  client = new ProxmoxClient(config);
  return client;
}

export function getClient(): ProxmoxClient {
  if (!client) {
    throw new Error("Proxmox client not initialized. Call initClient first.");
  }
  return client;
}
