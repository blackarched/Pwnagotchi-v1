import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Activity, 
  Zap, 
  Settings, 
  Terminal, 
  Radar,
  Lock,
  Power,
  BarChart2,
  GitBranch,
  Moon,
  Sun
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useTheme } from '@/hooks/useTheme'; // Import useTheme
import NetworkMap from '@/components/NetworkMap';
import SystemMetrics from '@/components/SystemMetrics';
import HandshakeCapture from '@/components/HandshakeCapture';
import PluginManager from '@/components/PluginManager';
import ConfigPanel from '@/components/config/ConfigPanel';
import TerminalInterface from '@/components/TerminalInterface';
import PwnagotchiFace from '@/components/PwnagotchiFace';
import HandshakeChart from '@/components/HandshakeChart';
import AdvancedTools from '@/components/AdvancedTools';
import { usePwnagotchi } from '@/hooks/usePwnagotchi';

const PwnagotchiDashboard = () => {
  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme(); // Use the theme hook
  const [activeTab, setActiveTab] = useState('overview');
  const {
    pwnagotchiState,
    networks, // Renamed from networkData
    handshakes, // Renamed from handshakeData, this is the list of handshake objects
    systemLogs, // Was correctly named
    plugins,
    config,
    // sendCommand, // Replaced by sendCommandViaHttp or sendCommandViaWebSocket
    sendCommandViaHttp,
    sendCommandViaWebSocket,
    updatePlugin,
    saveConfig,
    startDeauthAttack,
    // setConfig, // This is usually a direct state setter, not from the hook's public API typically
    isConnected, // Added isConnected
    handshakeHistory, // Was correctly named
    startLogStream, // Added
    stopLogStream,  // Added
    clearSystemLogs // Added
  } = usePwnagotchi();

  // Example: Determine if Pwnagotchi is online based on WebSocket connection and pwnagotchiState status
  const isPwnagotchiOnline = isConnected && pwnagotchiState.status !== 'connecting' && pwnagotchiState.status !== 'error_ws_connect' && pwnagotchiState.status !== 'error_http_fetch';


  const formatUptime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Decide whether to use HTTP or WebSocket for commands.
  // For simple Pwnagotchi CLI commands, HTTP via `sendCommandViaHttp` might be fine if the backend `/v1/command` route supports it.
  // Or, use `sendCommandViaWebSocket` if the backend's `client_command` handler is more generic.
  // Let's assume `sendCommandViaHttp` is for the existing `/v1/command` endpoint.
  const handleModeChange = (mode) => {
    sendCommandViaHttp(`mode ${mode}`); // Or sendCommandViaWebSocket({ command: 'mode', value: mode });
    toast({
      title: "Mode Change Requested",
      description: `Requesting Pwnagotchi mode to ${mode}.`,
    });
  };

  const handleStatusToggle = () => {
    // This command might be Pwnagotchi specific, e.g. 'service pwnagotchi start/stop' or an API call.
    // For now, assuming it's a high-level command the Pwnagotchi understands via its existing command endpoint.
    const command = pwnagotchiState.status === 'active' ? 'stop' : 'start'; // 'active' status needs confirmation
    sendCommandViaHttp(command); // Or sendCommandViaWebSocket({ command: command });
    toast({
      title: `Pwnagotchi ${command.charAt(0).toUpperCase() + command.slice(1)} Requested`,
      description: `Requesting to ${command} the Pwnagotchi service.`,
    });
  };

  // Effect to start log stream when terminal tab is active, and stop when inactive or component unmounts
  useEffect(() => {
    if (activeTab === 'terminal') {
      startLogStream(); // Default log file and lines
      return () => {
        stopLogStream();
      };
    }
  }, [activeTab, startLogStream, stopLogStream]);


  const tabs = [
    { id: 'overview', label: 'OVERVIEW', icon: Activity },
    { id: 'network', label: 'NETWORK MAP', icon: Radar },
    { id: 'handshakes', label: 'HANDSHAKES', icon: Lock },
    { id: 'advanced', label: 'ADVANCED', icon: GitBranch },
    { id: 'plugins', label: 'PLUGINS', icon: Zap },
    { id: 'config', label: 'CONFIG', icon: Settings },
    { id: 'terminal', label: 'TERMINAL', icon: Terminal }
  ];

  // Base classes for light theme, dark theme will override these
  const baseAppClasses = "min-h-screen transition-colors duration-300";
  const lightAppClasses = "bg-gray-100 text-slate-900";
  const darkAppClasses = "dark:bg-black dark:text-cyan-400 cyber-matrix"; // cyber-matrix likely adds specific dark visual effects

  const basePanelClasses = "transition-colors duration-300 rounded-lg";
  const lightPanelClasses = "bg-white border border-gray-200 shadow-sm";
  const darkPanelClasses = "dark:bg-slate-800/50 dark:border-cyan-400/30 dark:shadow-cyan-500/10"; // Example dark panel

  // Specific "cyber" styles might need to be conditionally applied or adjusted with dark: variants
  // For example, a button might be:
  // className={`px-2 py-1 rounded text-xs font-mono ${pwnagotchiState.mode === mode ? 'bg-sky-500 text-white dark:bg-cyan-400/20 dark:text-cyan-300' : 'bg-gray-200 hover:bg-gray-300 dark:bg-slate-700 dark:hover:bg-slate-600'}`}

  return (
    <div className={`${baseAppClasses} ${lightAppClasses} ${darkAppClasses}`}>
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`${basePanelClasses} ${lightPanelClasses} ${darkPanelClasses} p-4 border-b`} // Removed dark:border-cyan-400/30 from here as it's in darkPanelClasses
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 bg-gradient-to-r from-sky-500 to-indigo-600 dark:from-cyan-400 dark:to-magenta-500 flex items-center justify-center rounded-full shadow-lg" // Adjusted for light/dark
            >
              <Shield className="w-6 h-6 text-white dark:text-black" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold font-orbitron text-sky-700 dark:text-cyan-400 dark:cyber-glow">PWNAGOTCHI</h1>
              <p className="text-sm text-sky-600 dark:text-cyan-300">CYBER WARFARE INTERFACE v3.0</p>
            </div>
          </div>

          <div className="flex items-center space-x-4 md:space-x-6"> {/* Adjusted spacing for more items */}
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                isPwnagotchiOnline ? 'bg-green-400 dark:bg-green-500 cyber-pulse' : 'bg-red-400 dark:bg-red-600'
              }`} />
              <span className="text-sm font-mono text-slate-700 dark:text-cyan-300">
                {isPwnagotchiOnline ? 'ONLINE' : (isConnected ? pwnagotchiState.status?.toUpperCase().replace('_WS','').replace('_HTTP_FETCH','') : 'OFFLINE') }
              </span>
            </div>

            {/* Use the `handshakes` list (which is the list of handshake objects) */}
            {handshakes && handshakes.length > 0 && handshakes[0].timestamp && (
              <div className="text-sm font-mono text-slate-700 dark:text-cyan-300 hidden md:block">
                LAST HANDSHAKE: {new Date(handshakes[0].timestamp).toLocaleTimeString()}
              </div>
            )}

            <div className="text-sm font-mono text-slate-700 dark:text-cyan-300 hidden lg:block"> {/* Hide on smaller screens */}
              UPTIME: {formatUptime(pwnagotchiState.uptime || 0)}
            </div>

            {/* The definition of 'active' for pwnagotchiState.status might need to be confirmed from actual device states */}
            <Button
              onClick={handleStatusToggle}
              className={`cyber-button text-sm px-3 py-1 ${
                pwnagotchiState.status === 'active' || pwnagotchiState.mode === 'auto' || pwnagotchiState.mode === 'ai' ? 'cyber-button-destructive' : 'cyber-button-success'
              }`}
            >
              <Power className="w-4 h-4 mr-2" />
              {pwnagotchiState.status === 'active' ? 'DEACTIVATE' : 'ACTIVATE'}
            </Button>

            <Button
              onClick={toggleTheme}
              variant="ghost"
              size="icon"
              className="cyber-button text-cyan-400 hover:text-cyan-300"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </motion.header>

      <motion.nav 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="cyber-panel border-b border-cyan-400/30 p-2"
        role="navigation" // Added role for navigation landmark
      >
        <div role="tablist" aria-label="Dashboard sections" className="flex space-x-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                role="tab"
                aria-selected={isSelected}
                aria-controls={`tabpanel-${tab.id}`}
                tabIndex={isSelected ? 0 : -1} // Basic roving tabindex, more complex logic might be needed for arrow key nav
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded cyber-button font-mono text-xs transition-all ${
                  isSelected
                    ? 'bg-cyan-400/20 text-cyan-400 border-cyan-400' 
                    : 'text-cyan-300 hover:text-cyan-400'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </motion.button>
            );
          })}
        </div>
      </motion.nav>

      <main className="p-6 h-[calc(100vh-140px)] overflow-hidden">
        {/* Tab Panel Content - each should have role="tabpanel" and id matching aria-controls */}
        {activeTab === 'overview' && (
          <motion.div
            id="tabpanel-overview"
            role="tabpanel"
            aria-labelledby="overview" // Assuming tab button itself can be label, or add aria-label
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full"
          >
            <div className="lg:col-span-1 space-y-6">
              <div className="cyber-panel rounded-lg p-6 text-center">
                <PwnagotchiFace mood={pwnagotchiState.mood} />
                <div className="mt-4 h-10 flex items-center justify-center" aria-live="polite" aria-atomic="true">
                  <p className="text-sm text-cyan-300 font-mono cyber-flicker">
                    {pwnagotchiState.last_log}
                  </p>
                </div>
              </div>
              <div className="cyber-panel rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4 cyber-glow">SYSTEM STATUS</h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Mode:</span>
                    <div className="flex space-x-1">
                      {['auto', 'manual', 'ai'].map(mode => (
                        <button
                          key={mode}
                          onClick={() => handleModeChange(mode)}
                          className={`px-2 py-1 rounded text-xs font-mono cyber-button ${
                            pwnagotchiState.mode === mode ? 'bg-cyan-400/20' : ''
                          }`}
                        >
                          {mode.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-between text-sm"><span>Handshakes:</span><span className="text-green-400 font-mono">{pwnagotchiState.handshakes}</span></div>
                  <div className="flex justify-between text-sm"><span>Networks:</span><span className="text-cyan-400 font-mono">{pwnagotchiState.networks}</span></div>
                  <div className="flex justify-between text-sm"><span>Peers:</span><span className="text-pink-400 font-mono">{pwnagotchiState.peers}</span></div>
                  <div className="flex justify-between text-sm"><span>Epoch:</span><span className="text-yellow-400 font-mono">{pwnagotchiState.epoch}</span></div>
                </div>
              </div>
              <SystemMetrics data={pwnagotchiState} />
            </div>

            <div className="lg:col-span-2 grid grid-rows-2 gap-6 h-full">
              <div className="cyber-panel rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4 cyber-glow flex items-center"><BarChart2 className="mr-2"/>HANDSHAKE TRENDS</h2>
                <HandshakeChart data={handshakeHistory} />
              </div>
              <div className="cyber-panel rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4 cyber-glow">SYSTEM LOGS</h2>
                {/* System logs are now an array of strings, map them directly */}
                {/* Consider enhancing TerminalInterface to accept an array of log strings if it doesn't already */}
                <div className="h-full overflow-y-auto scrollbar-cyber cyber-terminal rounded p-4 text-xs">
                  {systemLogs.map((logLine, index) => (
                    <motion.div
                      key={index} // Using index as key for log lines; consider unique IDs if available
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                      className="font-mono whitespace-pre-wrap" // whitespace-pre-wrap to respect newlines from log
                    >
                      {logLine}
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Updated props for child components based on hook changes */}
        {activeTab === 'network' && <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="h-full"><NetworkMap networks={networks} fullscreen /></motion.div>}
        {activeTab === 'handshakes' && <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="h-full"><HandshakeCapture handshakes={handshakes} /></motion.div>}
        {activeTab === 'advanced' && <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="h-full"><AdvancedTools networks={networks} onStartAttack={startDeauthAttack} /></motion.div>}
        {activeTab === 'plugins' && <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="h-full"><PluginManager plugins={plugins} onTogglePlugin={updatePlugin} /></motion.div>}
        {activeTab === 'config' && <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="h-full"><ConfigPanel initialConfig={config} onSave={saveConfig} /></motion.div>} {/* Changed prop name to initialConfig */}
        {/* For TerminalInterface, decide if it should use sendCommandViaHttp or sendCommandViaWebSocket */}
        {/* It also needs to display systemLogs (which are now strings) or have a dedicated log view component */}
        {activeTab === 'terminal' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="h-full">
            <TerminalInterface
              logs={systemLogs} // Pass the string array of logs
              onSendCommand={sendCommandViaWebSocket} // Example: using WebSocket for terminal commands
              // onSendCommand={sendCommandViaHttp} // Or HTTP
              // Consider adding buttons to start/stop log stream here if not global
            />
            <div className="mt-2 flex space-x-2">
                <Button onClick={() => startLogStream()} className="cyber-button">Start Log Stream</Button>
                <Button onClick={stopLogStream} className="cyber-button cyber-button-destructive">Stop Log Stream</Button>
                <Button onClick={clearSystemLogs} className="cyber-button">Clear Displayed Logs</Button>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default PwnagotchiDashboard;