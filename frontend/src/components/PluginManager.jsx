import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, 
  Settings, 
  Play, 
  Pause, 
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const PluginManager = ({ plugins: initialPlugins = [], onTogglePlugin }) => {
  const { toast } = useToast();
  const [plugins, setPlugins] = useState(initialPlugins);
  const [selectedPlugin, setSelectedPlugin] = useState(null);

  useEffect(() => {
    setPlugins(initialPlugins);
  }, [initialPlugins]);

  const handleTogglePlugin = (pluginId, enabled) => {
    onTogglePlugin(pluginId, enabled);
  };

  const handleConfigurePlugin = (plugin) => {
    setSelectedPlugin(plugin);
  };

  const handleSaveConfig = (pluginId, newConfig) => {
    // In a real app, this would call an API to save the config.
    // For now, we just show a toast.
    setSelectedPlugin(null);
    toast({
      title: "Configuration Saved",
      description: "Plugin configuration updated successfully (simulation).",
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'inactive': return <XCircle className="w-4 h-4 text-red-400" />;
      case 'error': return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      default: return <Info className="w-4 h-4 text-cyan-400" />;
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      utility: 'text-blue-400', connectivity: 'text-green-400', logging: 'text-yellow-400',
      hardware: 'text-purple-400', monitoring: 'text-cyan-400', attack: 'text-red-400',
      social: 'text-pink-400', upload: 'text-orange-400'
    };
    return colors[category] || 'text-gray-400';
  };

  return (
    <div className="h-full flex">
      <div className="flex-1 cyber-panel rounded-lg p-6 mr-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold cyber-glow">PLUGIN MANAGER</h2>
          <div className="flex items-center space-x-4">
            <div className="text-sm font-mono">ACTIVE: <span className="text-green-400">{plugins.filter(p => p.enabled).length}</span></div>
            <div className="text-sm font-mono">TOTAL: <span className="text-cyan-400">{plugins.length}</span></div>
          </div>
        </div>
        <div className="space-y-3 h-[calc(100%-80px)] overflow-y-auto scrollbar-cyber">
          {plugins.map((plugin) => (
            <motion.div key={plugin.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="cyber-panel rounded p-4 hover:bg-cyan-400/5 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">{getStatusIcon(plugin.status)}<Package className="w-5 h-5 text-cyan-400" /></div>
                  <div>
                    <div className="flex items-center space-x-3">
                      <span className="font-mono text-lg text-cyan-400">{plugin.name}</span>
                      <span className={`text-xs px-2 py-1 rounded ${getCategoryColor(plugin.category)} bg-black/30`}>{plugin.category.toUpperCase()}</span>
                    </div>
                    <div className="text-sm text-cyan-300 mt-1">{plugin.description}</div>
                    <div className="text-xs text-cyan-300 mt-1">v{plugin.version} by {plugin.author}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button size="sm" onClick={() => handleConfigurePlugin(plugin)} className="cyber-button text-sm px-2 py-1"><Settings className="w-4 h-4" /></Button>
                  <Button size="sm" onClick={() => handleTogglePlugin(plugin.id, !plugin.enabled)} className={`cyber-button text-sm px-2 py-1 ${plugin.enabled ? 'cyber-button-destructive' : 'cyber-button-success'}`}>{plugin.enabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}</Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      {selectedPlugin && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="w-96 cyber-panel rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold cyber-glow">CONFIGURE</h3>
            <Button size="sm" onClick={() => setSelectedPlugin(null)} className="cyber-button"><XCircle className="w-4 h-4" /></Button>
          </div>
          <div className="space-y-4">
            <div>
              <h4 className="font-mono text-lg text-cyan-400 mb-2">{selectedPlugin.name}</h4>
              <p className="text-sm text-cyan-300 mb-4">{selectedPlugin.description}</p>
            </div>
            <div className="space-y-3">
              <h5 className="font-mono text-cyan-400">Configuration:</h5>
              {Object.entries(selectedPlugin.config).map(([key, value]) => (
                <div key={key} className="space-y-1">
                  <label className="text-sm font-mono text-cyan-300">{key}:</label>
                  <input type={typeof value === 'boolean' ? 'checkbox' : typeof value === 'number' ? 'number' : 'text'} defaultValue={typeof value === 'boolean' ? undefined : value} defaultChecked={typeof value === 'boolean' ? value : undefined} className="w-full bg-black/50 border border-cyan-400/30 rounded px-3 py-2 text-sm font-mono focus:border-cyan-400 focus:outline-none" />
                </div>
              ))}
            </div>
            <div className="flex space-x-3 pt-4">
              <Button onClick={() => handleSaveConfig(selectedPlugin.id, selectedPlugin.config)} className="flex-1 cyber-button cyber-button-success"><CheckCircle className="w-4 h-4 mr-2" />SAVE</Button>
              <Button onClick={() => setSelectedPlugin(null)} className="flex-1 cyber-button cyber-button-destructive">CANCEL</Button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default PluginManager;