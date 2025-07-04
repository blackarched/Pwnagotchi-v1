import React from 'react';

const ConfigSectionPersonality = ({ config, onConfigChange }) => {
  const sectionConfig = config.personality || {};

  return (
    <div className="space-y-4">
      <div>
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={sectionConfig.advertise || false}
            onChange={(e) => onConfigChange('personality', 'advertise', e.target.checked)}
            className="form-checkbox h-4 w-4 text-cyan-400 bg-black/50 border-cyan-400/30 rounded focus:ring-cyan-400"
          />
          <span className="text-sm font-mono text-cyan-300">Advertise</span>
        </label>
      </div>
      <div>
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={sectionConfig.deauth || false}
            onChange={(e) => onConfigChange('personality', 'deauth', e.target.checked)}
            className="form-checkbox h-4 w-4 text-cyan-400 bg-black/50 border-cyan-400/30 rounded focus:ring-cyan-400"
          />
          <span className="text-sm font-mono text-cyan-300">Deauth</span>
        </label>
      </div>
      <div>
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={sectionConfig.associate || false}
            onChange={(e) => onConfigChange('personality', 'associate', e.target.checked)}
            className="form-checkbox h-4 w-4 text-cyan-400 bg-black/50 border-cyan-400/30 rounded focus:ring-cyan-400"
          />
          <span className="text-sm font-mono text-cyan-300">Associate</span>
        </label>
      </div>
      <div>
        <label className="block text-sm font-mono text-cyan-300 mb-2">Recon Time (seconds):</label>
        <input
          type="number"
          min="1"
          value={sectionConfig.recon_time || 30}
          onChange={(e) => onConfigChange('personality', 'recon_time', parseInt(e.target.value))}
          className="w-full bg-black/50 border border-cyan-400/30 rounded px-3 py-2 text-sm font-mono focus:border-cyan-400 focus:outline-none"
        />
      </div>
    </div>
  );
};

export default ConfigSectionPersonality;