
import React from 'react';
import { motion } from 'framer-motion';
import { Cpu, HardDrive, Thermometer, Battery, Activity, Zap } from 'lucide-react';

const SystemMetrics = ({ data }) => {
  const metrics = [
    {
      label: 'CPU',
      value: data.cpu,
      max: 100,
      unit: '%',
      icon: Cpu,
      color: 'from-cyan-400 to-blue-500',
      threshold: 80
    },
    {
      label: 'Memory',
      value: data.memory,
      max: 100,
      unit: '%',
      icon: Activity,
      color: 'from-green-400 to-emerald-500',
      threshold: 85
    },
    {
      label: 'Storage',
      value: data.storage,
      max: 100,
      unit: '%',
      icon: HardDrive,
      color: 'from-purple-400 to-pink-500',
      threshold: 90
    },
    {
      label: 'Temperature',
      value: data.temperature,
      max: 100,
      unit: '°C',
      icon: Thermometer,
      color: 'from-orange-400 to-red-500',
      threshold: 70
    },
    {
      label: 'Battery',
      value: data.battery,
      max: 100,
      unit: '%',
      icon: Battery,
      color: 'from-yellow-400 to-green-500',
      threshold: 20
    }
  ];

  return (
    <div className="cyber-panel rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4 cyber-glow">SYSTEM METRICS</h2>
      <div className="space-y-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          const percentage = (metric.value / metric.max) * 100;
          const isWarning = metric.label === 'Temperature' ? 
            metric.value > metric.threshold : 
            metric.label === 'Battery' ? 
              metric.value < metric.threshold : 
              metric.value > metric.threshold;

          return (
            <div key={metric.label} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Icon className={`w-4 h-4 ${isWarning ? 'text-red-400' : 'text-cyan-400'}`} />
                  <span className="text-sm font-mono">{metric.label}</span>
                </div>
                <span className={`text-sm font-mono ${isWarning ? 'text-red-400' : 'text-cyan-400'}`}>
                  {metric.value}{metric.unit}
                </span>
              </div>
              
              <div className="relative h-2 bg-black/50 rounded-full overflow-hidden border border-cyan-400/30">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className={`h-full bg-gradient-to-r ${metric.color} ${isWarning ? 'animate-pulse' : ''}`}
                  style={{
                    boxShadow: isWarning ? '0 0 10px rgba(255, 0, 64, 0.5)' : '0 0 10px rgba(0, 255, 255, 0.3)'
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* System Status Indicators */}
      <div className="mt-6 pt-4 border-t border-cyan-400/30">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full cyber-pulse" />
            <span>WiFi Active</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-cyan-400 rounded-full cyber-pulse" />
            <span>Monitoring</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-yellow-400 rounded-full cyber-pulse" />
            <span>AI Learning</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-magenta-400 rounded-full cyber-pulse" />
            <span>Plugins OK</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemMetrics;
