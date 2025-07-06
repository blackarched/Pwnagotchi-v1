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
  const [networks, setNetworks] = useState([]); // List of discovered networks
  const [handshakes, setHandshakes] = useState([]); // List of captured handshakes
  const [systemLogs, setSystemLogs] = useState([]); // For Pwnagotchi system logs (streamed)
  const [plugins, setPlugins] = useState([]); // List of Pwnagotchi plugins and their status
  const [config, setConfig] = useState({}); // Pwnagotchi configuration object
  const [inbox, setInbox] = useState([]); // For Pwnmail/mesh messaging
  const [loading, setLoading] = useState(true);
  const [handshakeHistory, setHandshakeHistory] = useState([]); // For the HandshakeChart component

  const MAX_LOG_LINES = 200; // Max number of system log lines to keep in state
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
          // Initial system logs are not typically fetched via HTTP; they will come via WebSocket.
          // api.fetchLogs().catch(e => { logger.error('Failed to fetch initial logs:', e); return []; }),
        ]);

        if (isMounted) {
          if (initialPwnagotchiState) setPwnagotchiState(s => ({ ...s, ...initialPwnagotchiState, status: s.status === 'connecting' ? 'loaded_http' : s.status }));
          setNetworks(initialNetworks || []);
          setHandshakes(initialHandshakes || []); // This will be quickly updated by WS if connected
          // Populate handshakeHistory from initialHandshakes for the chart
          if (initialHandshakes && initialHandshakes.length > 0) {
            const history = initialHandshakes.map(h => ({ time: new Date(h.timestamp).toLocaleTimeString(), count: 1 })); // Simplified initial history
            // More sophisticated aggregation might be needed if timestamps are very close
            setHandshakeHistory(history.slice(-30)); // Keep last 30 points for chart
          }
          setConfig(initialConfig || {});
          setPlugins(initialPlugins || []);
          setInbox(initialInbox || []);
          // setSystemLogs(initialLogs || []); // Not fetching initial logs this way
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

    socket.on('handshakes:update', (updatedHandshakes) => {
      logger.debug('Received handshakes:update', updatedHandshakes);
      setHandshakes(updatedHandshakes);
      setPwnagotchiState(s => ({ ...s, handshakes: updatedHandshakes.length }));
      // Update handshake history for the chart
      // This is a simple way to add to history; might need more sophisticated time-based aggregation
      if (updatedHandshakes.length > 0) {
        // Assuming new handshakes are appended or the list is a full refresh
        // For simplicity, let's assume `updatedHandshakes` contains new ones since last update or is the full list
        // A more robust approach would be to diff or look for new entries specifically.
        const newHistoryPoint = { time: new Date().toLocaleTimeString(), count: updatedHandshakes.length };
        setHandshakeHistory(prevHistory => [...prevHistory.slice(-29), newHistoryPoint]);
      }
    });

    // This event should be 'handshakes:capture' if we want to capture individual new ones for the chart history
    socket.on('handshakes:capture', (newHandshake) => {
        logger.debug('Received handshakes:capture', newHandshake);
        // Add to main handshakes list (assuming newHandshake is a single object)
        setHandshakes(prev => [newHandshake, ...prev]);
        setPwnagotchiState(s => ({ ...s, handshakes: s.handshakes + 1 }));

        // Update history for chart (count of 1 for each new capture)
        const newHistoryPoint = { time: new Date(newHandshake.timestamp || Date.now()).toLocaleTimeString(), count: 1 };
         setHandshakeHistory(prevHistory => {
            // Simple aggregation: if last point was in same second, increment its count
            // This is very basic, real charting might need time-window based aggregation
            if (prevHistory.length > 0 && prevHistory[prevHistory.length -1].time === newHistoryPoint.time) {
                const lastPoint = {...prevHistory[prevHistory.length-1]};
                lastPoint.count +=1;
                return [...prevHistory.slice(0, -1), lastPoint].slice(-30);
            }
            return [...prevHistory, newHistoryPoint].slice(-30);
        });
    });


    socket.on('networks:update', (updatedNetworks) => {
      logger.debug('Received networks:update', updatedNetworks);
      setNetworks(updatedNetworks);
      setPwnagotchiState(s => ({ ...s, networks: updatedNetworks.length }));
    });

    socket.on('ai:status', (newAIStatus) => {
      logger.debug('Received ai:status', newAIStatus);
      setPwnagotchiState(s => ({ ...s, ...newAIStatus, status: 'connected_ws' }));
    });

    // Listener for Pwnagotchi logs
    socket.on('pwnagotchi:log', (logEntry) => {
      // logger.debug('Received pwnagotchi:log', logEntry); // Can be very verbose
      setSystemLogs(prevLogs => {
        const newLogs = [...prevLogs, logEntry.line || JSON.stringify(logEntry)];
        return newLogs.length > MAX_LOG_LINES ? newLogs.slice(newLogs.length - MAX_LOG_LINES) : newLogs;
      });
    });
    socket.on('pwnagotchi:log:error', (errorEntry) => {
      logger.error('Received pwnagotchi:log:error', errorEntry);
      setSystemLogs(prevLogs => {
        const newLogs = [...prevLogs, `[LOG ERROR] ${errorEntry.error || JSON.stringify(errorEntry)}`];
        return newLogs.length > MAX_LOG_LINES ? newLogs.slice(newLogs.length - MAX_LOG_LINES) : newLogs;
      });
    });
     socket.on('pwnagotchi:logs:stream_started', (status) => {
        logger.info('Pwnagotchi log stream started:', status);
        setSystemLogs(prev => [...prev, `[INFO] Log stream started for ${status.logFile}`]);
    });
    socket.on('pwnagotchi:logs:stream_stopped', (status) => {
        logger.info('Pwnagotchi log stream stopped:', status);
        setSystemLogs(prev => [...prev, `[INFO] Log stream stopped. ${status.message}`]);
    });
    socket.on('pwnagotchi:logs:stream_ended', (status) => {
        logger.info('Pwnagotchi log stream ended by backend:', status);
        setSystemLogs(prev => [...prev, `[INFO] Log stream ended by backend. ${status.message}`]);
    });


    return () => {
      logger.info('Cleaning up WebSocket connection.');
      if (socket) {
        socket.disconnect();
      }
      socketRef.current = null;
    };
  }, []);


  // Actions
  const sendCommandViaHttp = useCallback(async (command) => { // Renamed from sendCommand
    // For commands that go via HTTP POST to /api/v1/command
    try {
      const response = await api.sendCommand(command);
      // Optionally update pwnagotchiState or other state based on response
      setPwnagotchiState(s => ({ ...s, last_log: `Command '${command}' sent. Response: ${JSON.stringify(response)}` }));
      return response;
    } catch (err) {
      logger.error(`Error sending command '${command}' via HTTP:`, err);
      setError(err.message);
      setPwnagotchiState(s => ({ ...s, last_log: `Error sending command '${command}'.` }));
      throw err;
    }
  }, []);

  const sendCommandViaWebSocket = useCallback((commandPayload) => {
    // For commands that should be sent over WebSocket (e.g. to 'client_command' handler on backend)
    if (socketRef.current && isConnected) {
      socketRef.current.emit('client_command', commandPayload); // commandPayload might be { command: "...", params: ... }
      setPwnagotchiState(s => ({ ...s, last_log: `Command sent via WS: ${JSON.stringify(commandPayload)}` }));
    } else {
      logger.warn('Socket not connected. Cannot send command via WebSocket.');
      setError('Socket not connected for WS command.');
    }
  }, [isConnected]);


  const startLogStream = useCallback((logFile = '/var/log/pwnagotchi.log', lines = 50) => {
    if (socketRef.current && isConnected) {
      setSystemLogs([`[INFO] Attempting to start log stream for ${logFile}...`]); // Clear previous logs
      socketRef.current.emit('pwnagotchi:logs:start_stream', { logFile, lines });
    } else {
      logger.warn('Socket not connected. Cannot start log stream.');
    }
  }, [isConnected]);

  const stopLogStream = useCallback(() => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('pwnagotchi:logs:stop_stream');
    } else {
      logger.warn('Socket not connected. Cannot stop log stream.');
    }
  }, [isConnected]);


  const updatePlugin = useCallback(async (plugin, enabled) => {
    // Assumes this goes via HTTP API
    try {
      await api.updatePlugin(plugin, enabled);
      // Optimistically update local state or wait for a 'plugins:update' WS event
      setPlugins(prevPlugins => prevPlugins.map(p => p.name === plugin ? { ...p, status: enabled ? 'enabled' : 'disabled' } : p));
      // Or, better: fetchPlugins(); // if backend confirms and then we re-fetch
    } catch (err) {
      logger.error('Error updating plugin:', err);
      setError(err.message); // Show error to user
    }
  }, []);

  const saveConfig = useCallback(async (newConfig) => {
    try {
      await api.saveConfig(newConfig);
      setConfig(newConfig); // Optimistic update
      // toast({ title: "Config saved", description: "Pwnagotchi configuration updated."});
    } catch (err) {
      logger.error('Error saving config:', err);
      setError(err.message);
    }
  }, []);

  // Example: startDeauthAttack might now be a generic 'execute_tool' command via WebSocket or specific API
  const startDeauthAttack = useCallback(async (target) => {
    try {
      // This specific action might change to a more generic Pwnagotchi command
      // or a specific API endpoint if available.
      await api.startDeauthAttack(target);
      // Or: sendCommandViaWebSocket({ command: 'deauth', target: target });
    } catch (err) {
      logger.error('Error starting deauth attack:', err);
      setError(err.message);
    }
  }, []);

  // Helper for logging within the hook
  const logger = {
    info: (...args) => console.log('[usePwnagotchi INFO]', ...args),
    warn: (...args) => console.warn('[usePwnagotchi WARN]', ...args),
    error: (...args) => console.error('[usePwnagotchi ERROR]', ...args),
    debug: (...args) => console.debug('[usePwnagotchi DEBUG]', ...args),
  };

  // Returned state and functions
  return {
    pwnagotchiState,
    networks,
    handshakes, // This is the list of handshake objects
    systemLogs, // Renamed from 'logs' for clarity
    plugins,
    config,
    inbox,
    loading,
    error,
    isConnected,
    handshakeHistory, // For the chart

    sendCommandViaHttp, // Explicitly named
    sendCommandViaWebSocket, // For WS commands
    updatePlugin,
    saveConfig,
    startDeauthAttack, // This might be refactored/removed depending on Pwnagotchi capabilities

    startLogStream,
    stopLogStream,
    clearSystemLogs: () => setSystemLogs([]),
  };
}
