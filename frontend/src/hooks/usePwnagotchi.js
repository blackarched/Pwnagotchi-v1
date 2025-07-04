// usePwnagotchi.js (Production-Ready: Only Real API Calls)
import { useState, useEffect, useCallback } from 'react';
import * as api from './api';

export default function usePwnagotchi() {
  const [state, setState] = useState(null);
  const [networks, setNetworks] = useState([]);
  const [handshakes, setHandshakes] = useState([]);
  const [logs, setLogs] = useState([]);
  const [plugins, setPlugins] = useState([]);
  const [config, setConfig] = useState({});
  const [inbox, setInbox] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all data on mount and at intervals
  useEffect(() => {
    let isMounted = true;
    async function fetchAll() {
      setLoading(true);
      try {
        const [s, n, h, l, p, c, i] = await Promise.all([
          api.fetchState(),
          api.fetchNetworks(),
          api.fetchHandshakes(),
          api.fetchLogs(),
          api.fetchPlugins(),
          api.fetchConfig(),
          api.fetchInbox(),
        ]);
        if (isMounted) {
          setState(s);
          setNetworks(n);
          setHandshakes(h);
          setLogs(l);
          setPlugins(p);
          setConfig(c);
          setInbox(i);
          setError(null);
        }
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchAll();
    const interval = setInterval(fetchAll, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Actions
  const sendCommand = useCallback(async (command) => {
    await api.sendCommand(command);
    // Optionally refetch logs or state
  }, []);

  const updatePlugin = useCallback(async (plugin, enabled) => {
    await api.updatePlugin(plugin, enabled);
    // Optionally refetch plugins
  }, []);

  const saveConfig = useCallback(async (newConfig) => {
    await api.saveConfig(newConfig);
    setConfig(newConfig);
  }, []);

  const startDeauthAttack = useCallback(async (target) => {
    await api.startDeauthAttack(target);
    // Optionally refetch state or logs
  }, []);

  return {
    state,
    networks,
    handshakes,
    logs,
    plugins,
    config,
    inbox,
    loading,
    error,
    sendCommand,
    updatePlugin,
    saveConfig,
    startDeauthAttack,
  };
}
