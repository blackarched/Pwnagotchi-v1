// usePwnagotchi.js (Production-Ready: Real API Calls & WebSocket Integration)
import { useState, useEffect, useCallback, useRef } from 'react';
import io from 'socket.io-client';
import * as api from '../lib/api'; // Corrected path assuming api.js is in ../lib

// Environment variables for WebSocket connection
const VITE_WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';
const VITE_WEBSOCKET_PATH = import.meta.env.VITE_WEBSOCKET_PATH || '/socket.io';

export default function usePwnagotchi() {
  // Existing state variables
  const [pwnagotchiState, setPwnagotchiState] = useState({ // Renamed 'state' to 'pwnagotchiState' for clarity
    status: 'connecting', // Initial status
    mode: 'unknown',
    handshakes: 0,
    networks: 0,
    peers: 0,
    epoch: 0,
    uptime: 0,
    last_log: 'Initializing connection...'
  });
  const [networks, setNetworks] = useState([]);
  const [handshakes, setHandshakes] = useState([]);
  const [logs, setLogs] = useState([]);
  const [plugins, setPlugins] = useState([]);
  const [config, setConfig] = useState({});
  const [inbox, setInbox] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  // Initial data fetch (once on mount)
  useEffect(() => {
    let isMounted = true;
    async function fetchInitialData() {
      setLoading(true);
      try {
        // Fetch data that is less likely to change rapidly or is good for initial state
        // PwnagotchiState (overall status), config, plugins might be fetched here.
        // Handshakes and networks will primarily come from WebSocket, but an initial fetch can be useful.
        const [initialPwnagotchiState, initialNetworks, initialHandshakes, initialConfig, initialPlugins, initialInbox, initialLogs] = await Promise.all([
          api.fetchState().catch(e => { logger.error('Failed to fetch initial state:', e); return null; }), // Example: /api/v1/data
          api.fetchNetworks().catch(e => { logger.error('Failed to fetch initial networks:', e); return []; }), // Example: /api/v1/units
          api.fetchHandshakes().catch(e => { logger.error('Failed to fetch initial handshakes:', e); return []; }), // May not be needed if WS provides all
          api.fetchConfig().catch(e => { logger.error('Failed to fetch initial config:', e); return {}; }),
          api.fetchPlugins().catch(e => { logger.error('Failed to fetch initial plugins:', e); return []; }),
          api.fetchInbox().catch(e => { logger.error('Failed to fetch initial inbox:', e); return []; }),
          api.fetchLogs().catch(e => { logger.error('Failed to fetch initial logs:', e); return []; }), // For initial log view
        ]);

        if (isMounted) {
          if (initialPwnagotchiState) setPwnagotchiState(s => ({ ...s, ...initialPwnagotchiState, status: s.status === 'connecting' ? 'loaded_http' : s.status }));
          setNetworks(initialNetworks);
          setHandshakes(initialHandshakes); // This will be quickly updated by WS if connected
          setConfig(initialConfig);
          setPlugins(initialPlugins);
          setInbox(initialInbox);
          setLogs(initialLogs);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          logger.error('Error fetching initial data:', err);
          setError(err.message);
          setPwnagotchiState(s => ({ ...s, status: 'error_http_fetch' }));
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchInitialData();
    return () => { isMounted = false; };
  }, []);

  // WebSocket connection management
  useEffect(() => {
    if (socketRef.current) return; // Avoid multiple connections

    logger.info(`Attempting to connect to WebSocket: ${VITE_WS_URL} with path ${VITE_WEBSOCKET_PATH}`);
    socketRef.current = io(VITE_WS_URL, {
      path: VITE_WEBSOCKET_PATH,
      reconnectionAttempts: 5,
      timeout: 10000,
      transports: ['websocket'], // Force WebSocket transport
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      logger.info('WebSocket connected:', socket.id);
      setIsConnected(true);
      setPwnagotchiState(s => ({ ...s, status: 'connected_ws', last_log: 'WebSocket connected.' }));
    });

    socket.on('disconnect', (reason) => {
      logger.warn('WebSocket disconnected:', reason);
      setIsConnected(false);
      setPwnagotchiState(s => ({ ...s, status: 'disconnected_ws', last_log: `WebSocket disconnected: ${reason}` }));
    });

    socket.on('connect_error', (err) => {
      logger.error('WebSocket connection error:', err.message);
      setIsConnected(false);
      setPwnagotchiState(s => ({ ...s, status: 'error_ws_connect', last_log: `WS Connection Error: ${err.message}` }));
    });

    socket.on('server_message', (data) => {
      logger.info('Message from server:', data);
      // Could use this for general status updates or toasts
      // For now, just updating last_log as an example
      setPwnagotchiState(s => ({ ...s, last_log: data.message || JSON.stringify(data) }));
    });

    socket.on('handshakes:update', (newHandshakes) => {
      logger.debug('Received handshakes:update', newHandshakes);
      setHandshakes(newHandshakes);
      // Update handshake count in pwnagotchiState if it's part of the main status object
      setPwnagotchiState(s => ({ ...s, handshakes: newHandshakes.length }));
    });

    socket.on('networks:update', (newNetworks) => {
      logger.debug('Received networks:update', newNetworks);
      setNetworks(newNetworks);
      setPwnagotchiState(s => ({ ...s, networks: newNetworks.length }));
    });

    socket.on('ai:status', (newAIStatus) => {
      logger.debug('Received ai:status', newAIStatus);
      // Assuming newAIStatus contains fields like { mood, epoch, last_log, etc. }
      // Merge it into the existing pwnagotchiState
      setPwnagotchiState(s => ({ ...s, ...newAIStatus, status: 'connected_ws' }));
    });

    // TODO: Add listener for 'logs:new' if backend implements log streaming

    return () => {
      logger.info('Cleaning up WebSocket connection.');
      if (socket) {
        socket.disconnect();
      }
      socketRef.current = null;
    };
  }, []);


  // Actions (remain largely the same, but might trigger UI updates that reflect WS changes indirectly)
  const sendCommand = useCallback(async (command) => {
    // Could also send commands via WebSocket if backend supports it
    await api.sendCommand(command);
    // Optionally, backend could confirm command execution via a WS message
  }, []);

  const updatePlugin = useCallback(async (plugin, enabled) => {
    await api.updatePlugin(plugin, enabled);
    // Backend could emit a 'plugins:update' event
  }, []);

  const saveConfig = useCallback(async (newConfig) => {
    await api.saveConfig(newConfig);
    setConfig(newConfig); // Optimistic update
    // Backend could confirm save and emit 'config:update'
  }, []);

  const startDeauthAttack = useCallback(async (target) => {
    await api.startDeauthAttack(target);
    // Backend could emit 'attack:status' or log events
  }, []);

  // Helper for logging within the hook, as console from here might not always be visible
  const logger = {
    info: (...args) => console.log('[usePwnagotchi INFO]', ...args),
    warn: (...args) => console.warn('[usePwnagotchi WARN]', ...args),
    error: (...args) => console.error('[usePwnagotchi ERROR]', ...args),
    debug: (...args) => console.debug('[usePwnagotchi DEBUG]', ...args),
  };

  return {
    pwnagotchiState, // Renamed from 'state'
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
