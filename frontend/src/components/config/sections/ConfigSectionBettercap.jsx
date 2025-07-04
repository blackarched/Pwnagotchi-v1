import React from 'react';
import { Eye, EyeOff } from 'lucide-react';

const ConfigSectionBettercap = ({ config, onConfigChange, showPasswords, onTogglePasswords }) => {
  const sectionConfig = config.bettercap || {};

  return (
    <div className="space-y-4">
      <div>
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={sectionConfig.enabled || false}
            onChange={(e) => onConfigChange('bettercap', 'enabled', e.target.checked)}
            className="form-checkbox h-4 w-4 text-cyan-400 bg-black/50 border-cyan-400/30 rounded focus:ring-cyan-400"
          />
          <span className="text-sm font-mono text-cyan-300">Enable Bettercap</span>
        </label>
      </div>
      <div>
        <label className="block text-sm font-mono text-cyan-300 mb-2">Hostname:</label>
        <input
          type="text"
          value={sectionConfig.hostname || ''}
          onChange={(e) => onConfigChange('bettercap', 'hostname', e.target.value)}
          className="w-full bg-black/50 border border-cyan-400/30 rounded px-3 py-2 text-sm font-mono focus:border-cyan-400 focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-sm font-mono text-cyan-300 mb-2">Port:</label>
        <input
          type="number"
          min="1"
          max="65535"
          value={sectionConfig.port || 8081}
          onChange={(e) => onConfigChange('bettercap', 'port', parseInt(e.target.value))}
          className="w-full bg-black/50 border border-cyan-400/30 rounded px-3 py-2 text-sm font-mono focus:border-cyan-400 focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-sm font-mono text-cyan-300 mb-2">Username:</label>
        <input
          type="text"
          value={sectionConfig.username || ''}
          onChange={(e) => onConfigChange('bettercap', 'username', e.target.value)}
          className="w-full bg-black/50 border border-cyan-400/30 rounded px-3 py-2 text-sm font-mono focus:border-cyan-400 focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-sm font-mono text-cyan-300 mb-2">Password:</label>
        <div className="relative">
          <input
            type={showPasswords ? 'text' : 'password'}
            value={sectionConfig.password || ''}
            onChange={(e) => onConfigChange('bettercap', 'password', e.target.value)}
            className="w-full bg-black/50 border border-cyan-400/30 rounded px-3 py-2 pr-10 text-sm font-mono focus:border-cyan-400 focus:outline-none"
          />
          <button type="button" onClick={onTogglePasswords} className="absolute right-2 top-2 text-cyan-400">
            {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfigSectionBettercap;