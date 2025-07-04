import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, RotateCcw, Download, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { defaultConfig } from '@/components/config/defaultConfig';
import ConfigSectionNav from '@/components/config/ConfigSectionNav';
import ConfigRenderer from '@/components/config/ConfigRenderer';

const ConfigPanel = ({ config: initialConfig, onSave, setConfig: setParentConfig }) => {
  const { toast } = useToast();
  const [config, setConfig] = useState(initialConfig);
  const [activeSection, setActiveSection] = useState('main');
  const [showPasswords, setShowPasswords] = useState(false);

  useEffect(() => {
    setConfig(initialConfig);
  }, [initialConfig]);

  const handleConfigChange = (section, key, value) => {
    const newConfig = {
      ...config,
      [section]: { ...config[section], [key]: value }
    };
    setConfig(newConfig);
    setParentConfig(newConfig);
  };

  const handleNestedConfigChange = (section, parentKey, key, value) => {
    const newConfig = {
      ...config,
      [section]: {
        ...config[section],
        [parentKey]: { ...config[section][parentKey], [key]: value }
      }
    };
    setConfig(newConfig);
    setParentConfig(newConfig);
  };

  const handleSaveConfig = () => {
    onSave(config);
  };

  const handleResetConfig = () => {
    setConfig(defaultConfig);
    setParentConfig(defaultConfig);
    toast({
      title: "Configuration Reset",
      description: "Configuration reset to defaults. Save to apply.",
    });
  };

  const handleExportConfig = () => {
    const configJson = JSON.stringify(config, null, 2);
    const blob = new Blob([configJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pwnagotchi-config.json';
    a.click();
    URL.revokeObjectURL(url);
    toast({
      title: "Configuration Exported",
      description: "Configuration file downloaded",
    });
  };

  if (!config) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader className="w-12 h-12 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="h-full flex">
      <div className="w-64 cyber-panel rounded-lg p-6 mr-6">
        <h2 className="text-xl font-bold cyber-glow mb-6">CONFIGURATION</h2>
        <ConfigSectionNav activeSection={activeSection} setActiveSection={setActiveSection} />
        <div className="mt-8 space-y-3">
          <Button onClick={handleSaveConfig} className="w-full cyber-button cyber-button-success text-sm">
            <Save className="w-4 h-4 mr-2" /> SAVE CONFIG
          </Button>
          <Button onClick={handleExportConfig} className="w-full cyber-button text-sm">
            <Download className="w-4 h-4 mr-2" /> EXPORT
          </Button>
          <Button onClick={handleResetConfig} className="w-full cyber-button cyber-button-destructive text-sm">
            <RotateCcw className="w-4 h-4 mr-2" /> RESET
          </Button>
        </div>
      </div>

      <div className="flex-1 cyber-panel rounded-lg p-6">
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="h-full"
        >
          <ConfigRenderer
            activeSection={activeSection}
            config={config}
            onConfigChange={handleConfigChange}
            onNestedConfigChange={handleNestedConfigChange}
            showPasswords={showPasswords}
            onTogglePasswords={() => setShowPasswords(!showPasswords)}
          />
        </motion.div>
      </div>
    </div>
  );
};

export default ConfigPanel;