// Proxmox API response wrapper
export interface ProxmoxResponse<T> {
  data: T;
}

// Node/Cluster types
export interface Node {
  node: string;
  status: "online" | "offline";
  cpu: number;
  maxcpu: number;
  mem: number;
  maxmem: number;
  disk: number;
  maxdisk: number;
  uptime: number;
}

export interface ClusterStatus {
  nodes: number;
  quorate: number;
  version: number;
}

// VM types
export interface VM {
  vmid: number;
  name: string;
  status: "running" | "stopped" | "paused";
  node: string;
  cpu: number;
  cpus: number;
  mem: number;
  maxmem: number;
  disk: number;
  maxdisk: number;
  uptime: number;
  template: boolean;
}

export interface VMConfig {
  name?: string;
  description?: string;
  memory?: number;
  cores?: number;
  sockets?: number;
  ostype?: string;
  boot?: string;
  net0?: string;
  net1?: string;
  ide0?: string;
  ide2?: string;
  scsi0?: string;
  tags?: string;
  onboot?: number;
  agent?: string;
}

export interface ContainerConfig {
  hostname?: string;
  description?: string;
  memory?: number;
  swap?: number;
  cores?: number;
  cpulimit?: number;
  cpuunits?: number;
  ostype?: string;
  arch?: string;
  net0?: string;
  net1?: string;
  net2?: string;
  net3?: string;
  rootfs?: string;
  tags?: string;
  onboot?: number;
  startup?: string;
  unprivileged?: number;
  protection?: number;
  features?: string;
  cmode?: "tty" | "console" | "shell";
  lock?: string;
  template?: number;
}

// Container (LXC) types
export interface Container {
  vmid: number;
  name: string;
  status: "running" | "stopped";
  node: string;
  cpu: number;
  cpus: number;
  mem: number;
  maxmem: number;
  swap?: number;
  maxswap?: number;
  disk: number;
  maxdisk: number;
  uptime: number;
  template: boolean;
}

// Storage types
export interface Storage {
  storage: string;
  type: string;
  content: string;
  active: number;
  enabled: number;
  shared: number;
  used: number;
  avail: number;
  total: number;
}

// Task types
export interface Task {
  upid: string;
  node: string;
  pid: number;
  starttime: number;
  type: string;
  user: string;
  status?: string;
}

// Resource summary
export interface ResourceSummary {
  type: "vm" | "lxc" | "storage" | "node";
  id: string;
  node: string;
  status: string;
  name?: string;
  cpu?: number;
  mem?: number;
  maxmem?: number;
  disk?: number;
  maxdisk?: number;
}

// Network interface (from container/VM)
export interface NetworkInterface {
  name: string;
  hwaddr?: string;
  "inet"?: string;
  "inet6"?: string;
}

// Template types for LXC creation
export interface Template {
  volid: string;
  format: string;
  size: number;
  content: string;
}

export interface AvailableTemplate {
  template: string;
  type: string;
  package: string;
  version: string;
  os: string;
  section: string;
  headline: string;
  description?: string;
  maintainer?: string;
  location?: string;
  md5sum?: string;
  sha512sum?: string;
  infopage?: string;
}

// LXC creation configuration
export interface LXCCreateConfig {
  vmid: number;
  hostname: string;
  ostemplate: string;
  password?: string;
  "ssh-public-keys"?: string;
  cores?: number;
  memory?: number;
  swap?: number;
  rootfs: string; // format: "storage:size" e.g., "local-lvm:8"
  net0?: string; // format: "name=eth0,bridge=vmbr0,ip=dhcp" or with static IP
  nameserver?: string;
  searchdomain?: string;
  unprivileged?: boolean;
  start?: boolean;
  features?: string; // e.g., "nesting=1"
  onboot?: boolean;
}

// Network configuration for the wizard
export interface LXCNetworkConfig {
  bridge: string;
  ipType: "dhcp" | "static";
  ip?: string;
  gateway?: string;
  ip6Type?: "auto" | "dhcp" | "static" | "none";
  ip6?: string;
  gateway6?: string;
  firewall?: boolean;
}

// Storage content item
export interface StorageContent {
  volid: string;
  format: string;
  size: number;
  ctime?: number;
  content: string;
}
