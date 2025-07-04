import React from 'react';
import { Eye, EyeOff } from 'lucide-react';

const ConfigSectionUI = ({ config, onNestedConfigChange, showPasswords, onTogglePasswords }) => {
  const sectionConfig = config.ui || {};

  return (
    <div className="space-y-4">
      <div>
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={sectionConfig.display?.enabled || false}
            onChange={(e) => onNestedConfigChange('ui', 'display', 'enabled', e.target.checked)}
            className="form-checkbox h-4 w-4 text-cyan-400 bg-black/50 border-cyan-400/30 rounded focus:ring-cyan-400"
          />
          <span className="text-sm font-mono text-cyan-300">Enable Display</span>
        </label>
      </div>
      <div>
        <label className="block text-sm font-mono text-cyan-300 mb-2">Display Type:</label>
        <select
          value={sectionConfig.display?.type || 'waveshare_2'}
          onChange={(e) => onNestedConfigChange('ui', 'display', 'type', e.target.value)}
          className="w-full bg-black/50 border border-cyan-400/30 rounded px-3 py-2 text-sm font-mono focus:border-cyan-400 focus:outline-none"
        >
          <option value="waveshare_2">Waveshare 2.13"</option>
          <option value="waveshare_3">Waveshare 2.7"</option>
          <option value="oled">OLED</option>
          <option value="lcd">LCD</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-mono text-cyan-300 mb-2">Web Username:</label>
        <input
          type="text"
          value={sectionConfig.web?.username || ''}
          onChange={(e) => onNestedConfigChange('ui', 'web', 'username', e.target.value)}
          className="w-full bg-black/50 border border-cyan-400/30 rounded px-3 py-2 text-sm font-mono focus:border-cyan-400 focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-sm font-mono text-cyan-300 mb-2">Web Password:</label>
        <div className="relative">
          <input
            type={showPasswords ? 'text' : 'password'}
            value={sectionConfig.web?.password || ''}
            onChange={(e) => onNestedConfigChange('ui', 'web', 'password', e.target.value)}
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

export default ConfigSectionUI;