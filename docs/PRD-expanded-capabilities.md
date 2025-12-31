# Proxmux Expanded Capabilities PRD

## Overview

This PRD outlines the roadmap to make proxmux feature-complete with the Proxmox VE web UI. Each feature area will be implemented in its own worktree/branch for isolated, incremental development.

## Current State (v0.2.x)

- ✅ Dashboard with cluster overview
- ✅ VM listing and lifecycle (start/stop/reboot)
- ✅ Container listing and lifecycle (start/stop/reboot)
- ✅ Storage viewing
- ✅ Detail views for VMs/containers
- ✅ Console access (SSH via `pct console`)

---

## Feature Roadmap

### Tier 1: Essential Features

| Feature | Branch | Worktree | Priority |
|---------|--------|----------|----------|
| VM Creation | `feature/vm-creation` | `../proxmux-vm-creation` | P0 |
| LXC Creation | `feature/lxc-creation` | `../proxmux-lxc-creation` | P0 |
| ISO Management | `feature/iso-management` | `../proxmux-iso-management` | P0 |
| Template Management | `feature/templates` | `../proxmux-templates` | P0 |
| Backup & Restore | `feature/backup-restore` | `../proxmux-backup-restore` | P1 |
| Storage Management | `feature/storage-mgmt` | `../proxmux-storage-mgmt` | P1 |

### Tier 2: Core Functionality

| Feature | Branch | Worktree | Priority |
|---------|--------|----------|----------|
| Snapshots | `feature/snapshots` | `../proxmux-snapshots` | P1 |
| Task Monitoring | `feature/tasks` | `../proxmux-tasks` | P1 |
| VM/LXC Config Editor | `feature/config-editor` | `../proxmux-config-editor` | P2 |
| Network Configuration | `feature/network` | `../proxmux-network` | P2 |
| Firewall Rules | `feature/firewall` | `../proxmux-firewall` | P2 |

### Tier 3: Advanced Features

| Feature | Branch | Worktree | Priority |
|---------|--------|----------|----------|
| Migration | `feature/migration` | `../proxmux-migration` | P2 |
| High Availability | `feature/ha` | `../proxmux-ha` | P3 |
| Resource Pools | `feature/pools` | `../proxmux-pools` | P3 |
| Metrics & Graphs | `feature/metrics` | `../proxmux-metrics` | P3 |
| User/ACL Management | `feature/users` | `../proxmux-users` | P3 |

---

## Feature Specifications

### 1. VM Creation (`feature/vm-creation`)

**Goal:** Create QEMU VMs from the TUI with full hardware configuration.

**API Endpoints:**
- `POST /nodes/{node}/qemu` - Create VM
- `GET /nodes/{node}/storage/{storage}/content` - List ISOs
- `GET /nodes/{node}/qemu/{vmid}/config` - Get defaults

**UI Components:**
- [ ] VM Creation wizard (multi-step form)
- [ ] Node selector
- [ ] VMID input (with next-available suggestion)
- [ ] Name input
- [ ] ISO selector (from available storage)
- [ ] OS type selector
- [ ] CPU configuration (cores, sockets, type)
- [ ] Memory configuration
- [ ] Disk configuration (storage, size, format)
- [ ] Network configuration (bridge, model, MAC)
- [ ] Boot order selector
- [ ] Start after creation toggle

**Acceptance Criteria:**
- User can create a basic VM with ISO attached
- User can specify CPU, memory, and disk
- User can select network bridge
- VM appears in list after creation

---

### 2. LXC Creation (`feature/lxc-creation`)

**Goal:** Create LXC containers from templates or OCI images.

**API Endpoints:**
- `POST /nodes/{node}/lxc` - Create container
- `GET /nodes/{node}/aplinfo` - List available templates
- `POST /nodes/{node}/aplinfo` - Download template

**UI Components:**
- [ ] Container Creation wizard
- [ ] Template browser/selector
- [ ] OCI image input (registry URL)
- [ ] Template download progress
- [ ] VMID and hostname input
- [ ] Root password/SSH key input
- [ ] CPU and memory limits
- [ ] Root disk size
- [ ] Network configuration (bridge, IP, gateway)
- [ ] DNS configuration
- [ ] Unprivileged toggle
- [ ] Start after creation toggle

**Acceptance Criteria:**
- User can create container from template
- User can download new templates
- User can configure network (DHCP or static)
- Container appears in list after creation

---

### 3. ISO Management (`feature/iso-management`)

**Goal:** Upload, download, and manage ISO images.

**API Endpoints:**
- `GET /nodes/{node}/storage/{storage}/content?content=iso` - List ISOs
- `POST /nodes/{node}/storage/{storage}/upload` - Upload ISO
- `POST /nodes/{node}/storage/{storage}/download-url` - Download from URL
- `DELETE /nodes/{node}/storage/{storage}/content/{volume}` - Delete ISO

**UI Components:**
- [ ] ISO browser (list all ISOs across storage)
- [ ] Upload from local file
- [ ] Download from URL
- [ ] Upload/download progress indicator
- [ ] Delete ISO (with confirmation)
- [ ] ISO details (size, storage location)

**Acceptance Criteria:**
- User can list all available ISOs
- User can upload ISO from local machine
- User can download ISO from URL
- User can delete unused ISOs

---

### 4. Template Management (`feature/templates`)

**Goal:** Manage container templates and VM templates.

**API Endpoints:**
- `GET /nodes/{node}/aplinfo` - Available templates
- `POST /nodes/{node}/aplinfo` - Download template
- `GET /nodes/{node}/storage/{storage}/content?content=vztmpl` - List templates
- `POST /nodes/{node}/qemu/{vmid}/template` - Convert VM to template
- `POST /nodes/{node}/qemu/{vmid}/clone` - Clone from template

**UI Components:**
- [ ] Template browser (LXC templates)
- [ ] Available templates list (from Proxmox repo)
- [ ] Template download with progress
- [ ] VM-to-template conversion
- [ ] Clone from template wizard
- [ ] Template details view

**Acceptance Criteria:**
- User can browse available LXC templates
- User can download templates
- User can convert VM to template
- User can clone from template

---

### 5. Backup & Restore (`feature/backup-restore`)

**Goal:** Create, schedule, and restore backups.

**API Endpoints:**
- `POST /nodes/{node}/vzdump` - Create backup
- `GET /cluster/backup` - List backup jobs
- `POST /cluster/backup` - Create backup job
- `GET /nodes/{node}/storage/{storage}/content?content=backup` - List backups
- `POST /nodes/{node}/qemu` with `archive` param - Restore VM
- `POST /nodes/{node}/lxc` with `archive` param - Restore container

**UI Components:**
- [ ] Backup now (manual backup)
- [ ] Backup job scheduler
- [ ] Backup list browser
- [ ] Restore wizard
- [ ] Backup mode selector (snapshot, suspend, stop)
- [ ] Compression selector
- [ ] Storage destination selector
- [ ] Backup progress indicator

**Acceptance Criteria:**
- User can create manual backup
- User can schedule recurring backups
- User can browse existing backups
- User can restore VM/container from backup

---

### 6. Storage Management (`feature/storage-mgmt`)

**Goal:** Add, configure, and manage storage pools.

**API Endpoints:**
- `GET /storage` - List storage
- `POST /storage` - Add storage
- `PUT /storage/{storage}` - Update storage
- `DELETE /storage/{storage}` - Remove storage
- `GET /nodes/{node}/disks/list` - List disks

**UI Components:**
- [ ] Storage pool list (enhanced)
- [ ] Add storage wizard (NFS, CIFS, iSCSI, LVM, ZFS, Ceph, etc.)
- [ ] Storage configuration editor
- [ ] Storage content browser
- [ ] Disk inventory viewer
- [ ] Storage usage details

**Acceptance Criteria:**
- User can add new storage pools
- User can configure existing storage
- User can browse storage contents
- User can remove storage pools

---

### 7. Snapshots (`feature/snapshots`)

**Goal:** Create and manage VM/container snapshots.

**API Endpoints:**
- `GET /nodes/{node}/qemu/{vmid}/snapshot` - List snapshots
- `POST /nodes/{node}/qemu/{vmid}/snapshot` - Create snapshot
- `DELETE /nodes/{node}/qemu/{vmid}/snapshot/{snapname}` - Delete
- `POST /nodes/{node}/qemu/{vmid}/snapshot/{snapname}/rollback` - Rollback

**UI Components:**
- [ ] Snapshot list in detail view
- [ ] Create snapshot dialog
- [ ] Snapshot name and description input
- [ ] Include RAM toggle (for VMs)
- [ ] Rollback confirmation dialog
- [ ] Delete snapshot confirmation

**Acceptance Criteria:**
- User can view existing snapshots
- User can create new snapshots
- User can rollback to snapshot
- User can delete snapshots

---

### 8. Task Monitoring (`feature/tasks`)

**Goal:** View and manage running/completed tasks.

**API Endpoints:**
- `GET /nodes/{node}/tasks` - List tasks
- `GET /nodes/{node}/tasks/{upid}/status` - Task status
- `GET /nodes/{node}/tasks/{upid}/log` - Task log
- `DELETE /nodes/{node}/tasks/{upid}` - Stop task

**UI Components:**
- [ ] Task list view (new tab/view)
- [ ] Running tasks indicator in status bar
- [ ] Task progress display
- [ ] Task log viewer
- [ ] Stop task action
- [ ] Task filtering (by type, status)

**Acceptance Criteria:**
- User can see all running tasks
- User can view task progress and logs
- User can stop running tasks
- User gets notified of task completion

---

## Implementation Notes

### Worktree Workflow

```bash
# Create a new feature worktree
git worktree add ../proxmux-<feature> feature/<feature>

# Work in the worktree
cd ../proxmux-<feature>

# When done, merge to main
git checkout main
git merge feature/<feature>

# Clean up worktree
git worktree remove ../proxmux-<feature>
```

### Shared Components to Build

As features are implemented, these shared components should be extracted:

1. **Form Components** - Text input, select, checkbox, radio for wizards
2. **Progress Indicator** - For uploads, downloads, long-running tasks
3. **Wizard Framework** - Multi-step form navigation
4. **Confirmation Dialog** - Reusable confirmation prompts
5. **Task Tracker** - Background task monitoring

### API Client Extensions

Each feature will extend `src/api/client.ts` with new methods. Consider:
- Organizing by feature area (vm.ts, lxc.ts, storage.ts, etc.)
- Shared response types in `src/api/types.ts`
- Error handling patterns

---

## Getting Started

Recommended order for implementation:

1. **VM Creation** - Most requested, establishes wizard pattern
2. **LXC Creation** - Similar pattern, different options
3. **ISO Management** - Required for VM creation to be useful
4. **Templates** - Required for LXC creation to be useful
5. **Snapshots** - Quick win, small scope
6. **Task Monitoring** - Improves UX for all long-running operations
7. **Backup & Restore** - Critical for production use
8. **Storage Management** - Rounds out core functionality

---

## Success Metrics

- All Tier 1 features implemented
- User can perform common workflows without web UI
- No loss of data or misconfiguration from TUI actions
- Response times comparable to web UI
