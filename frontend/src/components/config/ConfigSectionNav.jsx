import React from 'react';
import { motion } from 'framer-motion';
import { Settings, Eye, Zap, User, Terminal } from 'lucide-react';

const navItems = [
  { id: 'main', label: 'Main', icon: Settings },
  { id: 'ui', label: 'Interface', icon: Eye },
  { id: 'ai', label: 'AI Brain', icon: Zap },
  { id: 'personality', label: 'Personality', icon: User },
  { id: 'bettercap', label: 'Bettercap', icon: Terminal }
];

const ConfigSectionNav = ({ activeSection, setActiveSection }) => {
  return (
    <div className="space-y-2">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <motion.button
            key={item.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveSection(item.id)}
            className={`w-full flex items-center space-x-3 p-3 rounded cyber-button text-left transition-all text-sm ${
              activeSection === item.id 
                ? 'bg-cyan-400/20 text-cyan-400 border-cyan-400' 
                : 'text-cyan-300 hover:text-cyan-400'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="font-mono">{item.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
};

export default ConfigSectionNav;