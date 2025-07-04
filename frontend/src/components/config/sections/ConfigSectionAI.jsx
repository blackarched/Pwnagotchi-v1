import React from 'react';

const ConfigSectionAI = ({ config, onConfigChange, onNestedConfigChange }) => {
  const sectionConfig = config.ai || {};

  return (
    <div className="space-y-4">
      <div>
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={sectionConfig.enabled || false}
            onChange={(e) => onConfigChange('ai', 'enabled', e.target.checked)}
            className="form-checkbox h-4 w-4 text-cyan-400 bg-black/50 border-cyan-400/30 rounded focus:ring-cyan-400"
          />
          <span className="text-sm font-mono text-cyan-300">Enable AI</span>
        </label>
      </div>
      <div>
        <label className="block text-sm font-mono text-cyan-300 mb-2">Brain Path:</label>
        <input
          type="text"
          value={sectionConfig.path || ''}
          onChange={(e) => onConfigChange('ai', 'path', e.target.value)}
          className="w-full bg-black/50 border border-cyan-400/30 rounded px-3 py-2 text-sm font-mono focus:border-cyan-400 focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-sm font-mono text-cyan-300 mb-2">Laziness:</label>
        <input
          type="number"
          step="0.01"
          min="0"
          max="1"
          value={sectionConfig.laziness || 0.05}
          onChange={(e) => onConfigChange('ai', 'laziness', parseFloat(e.target.value))}
          className="w-full bg-black/50 border border-cyan-400/30 rounded px-3 py-2 text-sm font-mono focus:border-cyan-400 focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-sm font-mono text-cyan-300 mb-2">Learning Rate:</label>
        <input
          type="number"
          step="0.001"
          min="0"
          max="1"
          value={sectionConfig.params?.lr || 0.002}
          onChange={(e) => onNestedConfigChange('ai', 'params', 'lr', parseFloat(e.target.value))}
          className="w-full bg-black/50 border border-cyan-400/30 rounded px-3 py-2 text-sm font-mono focus:border-cyan-400 focus:outline-none"
        />
      </div>
    </div>
  );
};

export default ConfigSectionAI;