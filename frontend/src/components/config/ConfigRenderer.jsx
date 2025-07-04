import React from 'react';
import ConfigSectionMain from '@/components/config/sections/ConfigSectionMain';
import ConfigSectionUI from '@/components/config/sections/ConfigSectionUI';
import ConfigSectionAI from '@/components/config/sections/ConfigSectionAI';
import ConfigSectionPersonality from '@/components/config/sections/ConfigSectionPersonality';
import ConfigSectionBettercap from '@/components/config/sections/ConfigSectionBettercap';

const sections = {
  main: { label: 'Main', component: ConfigSectionMain },
  ui: { label: 'Interface', component: ConfigSectionUI },
  ai: { label: 'AI Brain', component: ConfigSectionAI },
  personality: { label: 'Personality', component: ConfigSectionPersonality },
  bettercap: { label: 'Bettercap', component: ConfigSectionBettercap },
};

const ConfigRenderer = ({ activeSection, ...props }) => {
  const SectionComponent = sections[activeSection]?.component;

  return (
    <>
      <h3 className="text-2xl font-bold cyber-glow mb-6">
        {sections[activeSection]?.label.toUpperCase()} SETTINGS
      </h3>
      <div className="h-[calc(100%-80px)] overflow-y-auto scrollbar-cyber pr-4">
        {SectionComponent ? <SectionComponent {...props} /> : <div>Select a configuration section</div>}
      </div>
    </>
  );
};

export default ConfigRenderer;