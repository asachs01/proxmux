import React, { useState, useEffect } from "react";
import { useApp, useInput } from "ink";
import { Layout } from "./components/Layout.tsx";
import type { View } from "./components/Sidebar.tsx";
import { Dashboard } from "./views/Dashboard.tsx";
import { VMs } from "./views/VMs.tsx";
import { Containers } from "./views/Containers.tsx";
import { Storage } from "./views/Storage.tsx";
import type { ProxmuxConfig } from "./config/index.ts";
import { getClient } from "./api/client.ts";

interface AppProps {
  config: ProxmuxConfig;
}

const views: View[] = ["dashboard", "vms", "containers", "storage"];

export function App({ config }: AppProps) {
  const { exit } = useApp();
  const [currentView, setCurrentView] = useState<View>("dashboard");
  const [connected, setConnected] = useState(false);

  // Test connection on mount
  useEffect(() => {
    getClient()
      .testConnection()
      .then(setConnected)
      .catch(() => setConnected(false));
  }, []);

  // Global keyboard shortcuts (handles view switching and quit)
  useInput((input, key) => {
    // View switching with number keys
    const num = parseInt(input);
    if (num >= 1 && num <= views.length) {
      const view = views[num - 1];
      if (view) {
        setCurrentView(view as View);
      }
    }

    // Quit
    if (input === "q" && !key.ctrl) {
      exit();
    }
    // Ctrl+C
    if (key.ctrl && input === "c") {
      exit();
    }
  });

  const renderView = () => {
    switch (currentView) {
      case "dashboard":
        return <Dashboard />;
      case "vms":
        return <VMs />;
      case "containers":
        return <Containers />;
      case "storage":
        return <Storage />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout
      currentView={currentView}
      onViewChange={setCurrentView}
      connected={connected}
      host={config.host}
    >
      {renderView()}
    </Layout>
  );
}
