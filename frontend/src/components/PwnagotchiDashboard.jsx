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
  GitBranch
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
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
  const [activeTab, setActiveTab] = useState('overview');
  const {
    pwnagotchiState,
    networkData,
    handshakeData,
    handshakeHistory,
    systemLogs,
    plugins,
    config,
    sendCommand,
    updatePlugin,
    saveConfig,
    startDeauthAttack,
    setConfig,
  } = usePwnagotchi();

  const formatUptime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleModeChange = (mode) => {
    sendCommand(`mode ${mode}`);
    toast({
      title: "Mode Change Requested",
      description: `Requesting to set Pwnagotchi mode to ${mode}`,
    });
  };

  const handleStatusToggle = () => {
    const command = pwnagotchiState.status === 'active' ? 'stop' : 'start';
    sendCommand(command);
    toast({
      title: `Pwnagotchi ${command.charAt(0).toUpperCase() + command.slice(1)} Requested`,
      description: `Requesting to ${command} the Pwnagotchi service.`,
    });
  };

  const tabs = [
    { id: 'overview', label: 'OVERVIEW', icon: Activity },
    { id: 'network', label: 'NETWORK MAP', icon: Radar },
    { id: 'handshakes', label: 'HANDSHAKES', icon: Lock },
    { id: 'advanced', label: 'ADVANCED', icon: GitBranch },
    { id: 'plugins', label: 'PLUGINS', icon: Zap },
    { id: 'config', label: 'CONFIG', icon: Settings },
    { id: 'terminal', label: 'TERMINAL', icon: Terminal }
  ];

  return (
    <div className="min-h-screen bg-black text-cyan-400 cyber-matrix">
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="cyber-panel border-b border-cyan-400/30 p-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 cyber-hexagon bg-gradient-to-r from-cyan-400 to-magenta-500 flex items-center justify-center"
            >
              <Shield className="w-6 h-6 text-black" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold cyber-glow font-orbitron">PWNAGOTCHI</h1>
              <p className="text-sm text-cyan-300">CYBER WARFARE INTERFACE v3.0</p>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                pwnagotchiState.status === 'active' ? 'bg-green-400 cyber-pulse' : 'bg-red-400'
              }`} />
              <span className="text-sm font-mono">
                {pwnagotchiState.status.toUpperCase()}
              </span>
            </div>

            <div className="text-sm font-mono">
              UPTIME: {formatUptime(pwnagotchiState.uptime)}
            </div>

            <Button
              onClick={handleStatusToggle}
              className={`cyber-button text-sm px-3 py-1 ${
                pwnagotchiState.status === 'active' ? 'cyber-button-destructive' : 'cyber-button-success'
              }`}
            >
              <Power className="w-4 h-4 mr-2" />
              {pwnagotchiState.status === 'active' ? 'DEACTIVATE' : 'ACTIVATE'}
            </Button>
          </div>
        </div>
      </motion.header>

      <motion.nav 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="cyber-panel border-b border-cyan-400/30 p-2"
      >
        <div className="flex space-x-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded cyber-button font-mono text-xs transition-all ${
                  activeTab === tab.id 
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
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full"
          >
            <div className="lg:col-span-1 space-y-6">
              <div className="cyber-panel rounded-lg p-6 text-center">
                <PwnagotchiFace mood={pwnagotchiState.mood} />
                <div className="mt-4 h-10 flex items-center justify-center">
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
                <div className="h-full overflow-y-auto scrollbar-cyber cyber-terminal rounded p-4">
                  {systemLogs.map(log => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center space-x-3 py-1 text-sm font-mono"
                    >
                      <span className="text-cyan-300 text-xs">{new Date(log.timestamp).toLocaleTimeString()}</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        log.level === 'INFO' ? 'bg-blue-500/20 text-blue-400' : 
                        log.level === 'WARN' ? 'bg-yellow-500/20 text-yellow-400' :
                        log.level === 'ERROR' ? 'bg-red-500/20 text-red-400' :
                        'bg-green-500/20 text-green-400'}`}>{log.level}</span>
                      <span className="text-cyan-400">{log.message}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'network' && <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="h-full"><NetworkMap networks={networkData} fullscreen /></motion.div>}
        {activeTab === 'handshakes' && <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="h-full"><HandshakeCapture handshakes={handshakeData} /></motion.div>}
        {activeTab === 'advanced' && <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="h-full"><AdvancedTools networks={networkData} onStartAttack={startDeauthAttack} /></motion.div>}
        {activeTab === 'plugins' && <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="h-full"><PluginManager plugins={plugins} onTogglePlugin={updatePlugin} /></motion.div>}
        {activeTab === 'config' && <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="h-full"><ConfigPanel config={config} onSave={saveConfig} setConfig={setConfig} /></motion.div>}
        {activeTab === 'terminal' && <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="h-full"><TerminalInterface logs={systemLogs} onSendCommand={sendCommand} /></motion.div>}
      </main>
    </div>
  );
};

export default PwnagotchiDashboard;