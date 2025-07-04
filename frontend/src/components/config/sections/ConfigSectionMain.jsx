import React from 'react';

const ConfigSectionMain = ({ config, onConfigChange }) => {
  const sectionConfig = config.main || {};

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-mono text-cyan-300 mb-2">Name:</label>
        <input
          type="text"
          value={sectionConfig.name || ''}
          onChange={(e) => onConfigChange('main', 'name', e.target.value)}
          className="w-full bg-black/50 border border-cyan-400/30 rounded px-3 py-2 text-sm font-mono focus:border-cyan-400 focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-sm font-mono text-cyan-300 mb-2">Language:</label>
        <select
          value={sectionConfig.lang || 'en'}
          onChange={(e) => onConfigChange('main', 'lang', e.target.value)}
          className="w-full bg-black/50 border border-cyan-400/30 rounded px-3 py-2 text-sm font-mono focus:border-cyan-400 focus:outline-none"
        >
          <option value="en">English</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
          <option value="de">German</option>
          <option value="it">Italian</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-mono text-cyan-300 mb-2">Log Level:</label>
        <select
          value={sectionConfig.log_level || 'INFO'}
          onChange={(e) => onConfigChange('main', 'log_level', e.target.value)}
          className="w-full bg-black/50 border border-cyan-400/30 rounded px-3 py-2 text-sm font-mono focus:border-cyan-400 focus:outline-none"
        >
          <option value="DEBUG">DEBUG</option>
          <option value="INFO">INFO</option>
          <option value="WARNING">WARNING</option>
          <option value="ERROR">ERROR</option>
        </select>
      </div>
    </div>
  );
};

export default ConfigSectionMain;