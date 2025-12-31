import React, { useState, useEffect } from "react";
import { Box, Text, useInput } from "ink";
import { StatusBadge } from "./common/StatusBadge.tsx";
import { ProgressBar } from "./common/ProgressBar.tsx";
import { Spinner } from "./common/Spinner.tsx";
import { formatBytes, formatUptime } from "../utils/format.ts";
import { getClient } from "../api/client.ts";
import type { VMConfig, ContainerConfig } from "../api/types.ts";

interface DetailViewProps {
  type: "vm" | "container";
  item: {
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
  };
  onBack: () => void;
  onStart: () => Promise<void>;
  onStop: () => Promise<void>;
  onReboot: () => Promise<void>;
}

type Action = "start" | "stop" | "reboot";
type PendingConfirm = Action | null;

function parseNetworkInfo(netConfig?: string): { ip?: string; mac?: string; bridge?: string } {
  if (!netConfig) return {};
  const parts = netConfig.split(",");
  const result: { ip?: string; mac?: string; bridge?: string } = {};

  for (const part of parts) {
    if (part.startsWith("ip=")) {
      result.ip = part.substring(3).split("/")[0];
    } else if (part.includes("=")) {
      const [key, value] = part.split("=");
      if (key === "bridge") result.bridge = value;
      if (value?.match(/^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/)) {
        result.mac = value;
      }
    } else if (part.match(/^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/)) {
      result.mac = part;
    }
  }
  return result;
}

export function DetailView({
  type,
  item,
  onBack,
  onStart,
  onStop,
  onReboot,
}: DetailViewProps) {
  const [selectedAction, setSelectedAction] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm>(null);
  const [config, setConfig] = useState<VMConfig | ContainerConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(true);

  const isRunning = item.status === "running";

  // Fetch config on mount
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const client = getClient();
        if (type === "vm") {
          const cfg = await client.getVMConfig(item.node, item.vmid);
          setConfig(cfg);
        } else {
          const cfg = await client.getContainerConfig(item.node, item.vmid);
          setConfig(cfg);
        }
      } catch {
        // Config fetch failed, continue without it
      } finally {
        setConfigLoading(false);
      }
    };
    fetchConfig();
  }, [type, item.node, item.vmid]);

  const actions: { key: Action; label: string; enabled: boolean; destructive: boolean }[] = [
    { key: "start", label: "Start", enabled: !isRunning, destructive: false },
    { key: "stop", label: "Stop", enabled: isRunning, destructive: true },
    { key: "reboot", label: "Reboot", enabled: isRunning, destructive: true },
  ];

  const enabledActions = actions.filter((a) => a.enabled);

  useInput(async (input, key) => {
    if (loading) return;

    // Handle confirmation
    if (pendingConfirm) {
      if (key.return || input === "y") {
        setLoading(true);
        setError(null);
        try {
          if (pendingConfirm === "stop") await onStop();
          else if (pendingConfirm === "reboot") await onReboot();
          onBack();
        } catch (err) {
          setError(err instanceof Error ? err.message : "Action failed");
          setLoading(false);
        }
        setPendingConfirm(null);
      } else if (key.escape || input === "n" || input === "q") {
        setPendingConfirm(null);
      }
      return;
    }

    if (key.escape || input === "q") {
      onBack();
      return;
    }

    if (input === "j" || key.downArrow) {
      setSelectedAction((prev) => (prev + 1) % enabledActions.length);
    } else if (input === "k" || key.upArrow) {
      setSelectedAction((prev) => (prev - 1 + enabledActions.length) % enabledActions.length);
    }

    if (key.return) {
      const action = enabledActions[selectedAction];
      if (!action) return;

      // Require confirmation for destructive actions
      if (action.destructive) {
        setPendingConfirm(action.key);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        if (action.key === "start") await onStart();
        onBack();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Action failed");
        setLoading(false);
      }
    }
  });

  const cpuPercent = item.cpus > 0 ? (item.cpu * 100) : 0;
  const memPercent = item.maxmem > 0 ? (item.mem / item.maxmem) * 100 : 0;
  const diskPercent = item.maxdisk > 0 ? (item.disk / item.maxdisk) * 100 : 0;

  const label = type === "vm" ? "Virtual Machine" : "Container";

  // Parse network info from config
  const netInfo = parseNetworkInfo(config?.net0);

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold color="blue">{label} Details</Text>
        <Text dimColor> (Esc to go back)</Text>
      </Box>

      {/* Confirmation dialog */}
      {pendingConfirm && (
        <Box marginBottom={1} paddingX={1} borderStyle="round" borderColor="yellow">
          <Text color="yellow">
            {pendingConfirm === "stop" ? "Stop" : "Reboot"} {type} "{item.name || item.vmid}"?
            <Text dimColor> (y/Enter to confirm, n/Esc to cancel)</Text>
          </Text>
        </Box>
      )}

      <Box flexDirection="row" gap={2}>
        {/* Left: Info */}
        <Box flexDirection="column" borderStyle="round" borderColor="gray" paddingX={2} paddingY={1} width={50}>
          <Box marginBottom={1}>
            <StatusBadge status={item.status} />
            <Text> </Text>
            <Text bold>{item.name || `${type === "vm" ? "VM" : "CT"} ${item.vmid}`}</Text>
          </Box>

          {/* Basic Info */}
          <Box marginBottom={1} flexDirection="column">
            <Text bold dimColor>General</Text>
            <Box>
              <Box width={14}><Text dimColor>ID:</Text></Box>
              <Text>{item.vmid}</Text>
            </Box>
            <Box>
              <Box width={14}><Text dimColor>Node:</Text></Box>
              <Text>{item.node}</Text>
            </Box>
            <Box>
              <Box width={14}><Text dimColor>Status:</Text></Box>
              <Text>{item.status}</Text>
            </Box>
            {isRunning && (
              <Box>
                <Box width={14}><Text dimColor>Uptime:</Text></Box>
                <Text>{formatUptime(item.uptime)}</Text>
              </Box>
            )}
            {config?.tags && (
              <Box>
                <Box width={14}><Text dimColor>Tags:</Text></Box>
                <Text color="cyan">{config.tags}</Text>
              </Box>
            )}
            {config?.onboot !== undefined && (
              <Box>
                <Box width={14}><Text dimColor>Start on boot:</Text></Box>
                <Text>{config.onboot ? "Yes" : "No"}</Text>
              </Box>
            )}
          </Box>

          {/* Network Info */}
          {(netInfo.ip || netInfo.mac || netInfo.bridge) && (
            <Box marginBottom={1} flexDirection="column">
              <Text bold dimColor>Network</Text>
              {netInfo.ip && (
                <Box>
                  <Box width={14}><Text dimColor>IP Address:</Text></Box>
                  <Text>{netInfo.ip}</Text>
                </Box>
              )}
              {netInfo.mac && (
                <Box>
                  <Box width={14}><Text dimColor>MAC:</Text></Box>
                  <Text>{netInfo.mac}</Text>
                </Box>
              )}
              {netInfo.bridge && (
                <Box>
                  <Box width={14}><Text dimColor>Bridge:</Text></Box>
                  <Text>{netInfo.bridge}</Text>
                </Box>
              )}
            </Box>
          )}

          {/* Config loading */}
          {configLoading && (
            <Box>
              <Spinner label="Loading config..." />
            </Box>
          )}

          {/* Resources */}
          <Box flexDirection="column">
            <Text bold dimColor>Resources</Text>
            <Box>
              <Box width={14}><Text dimColor>CPU:</Text></Box>
              <ProgressBar percent={cpuPercent} width={15} />
              <Text dimColor> {item.cpus} cores</Text>
            </Box>
            <Box>
              <Box width={14}><Text dimColor>Memory:</Text></Box>
              <ProgressBar percent={memPercent} width={15} />
              <Text dimColor> {formatBytes(item.mem)} / {formatBytes(item.maxmem)}</Text>
            </Box>
            <Box>
              <Box width={14}><Text dimColor>Disk:</Text></Box>
              <ProgressBar percent={diskPercent} width={15} />
              <Text dimColor> {formatBytes(item.disk)} / {formatBytes(item.maxdisk)}</Text>
            </Box>
          </Box>

          {/* Description */}
          {config?.description && (
            <Box marginTop={1} flexDirection="column">
              <Text bold dimColor>Description</Text>
              <Text>{config.description.substring(0, 100)}{config.description.length > 100 ? "..." : ""}</Text>
            </Box>
          )}
        </Box>

        {/* Right: Actions */}
        <Box flexDirection="column" borderStyle="round" borderColor="gray" paddingX={2} paddingY={1} minWidth={20}>
          <Box marginBottom={1}>
            <Text bold dimColor>Actions</Text>
          </Box>

          {enabledActions.map((action, index) => (
            <Box key={action.key}>
              <Text
                inverse={selectedAction === index}
                color={selectedAction === index ? (action.destructive ? "red" : "cyan") : undefined}
              >
                {" "}{action.label}{" "}
              </Text>
            </Box>
          ))}

          {enabledActions.length === 0 && (
            <Text dimColor>No actions available</Text>
          )}

          {error && (
            <Box marginTop={1}>
              <Text color="red">{error}</Text>
            </Box>
          )}

          {loading && (
            <Box marginTop={1}>
              <Spinner label="Processing..." />
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
