
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Wifi, Shield, Lock, Unlock, Signal, Eye, MapPin } from 'lucide-react';

const NetworkMap = ({ networks = [], fullscreen = false }) => {
  const canvasRef = useRef(null);
  const [selectedNetwork, setSelectedNetwork] = useState(null);
  const [scanRadius, setScanRadius] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Clear canvas
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    const gridSize = 20;
    
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw center (pwnagotchi)
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Scanning radius animation
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, scanRadius, 0, 2 * Math.PI);
    ctx.stroke();

    // Draw pwnagotchi at center
    ctx.fillStyle = '#00ffff';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 8, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Orbitron';
    ctx.textAlign = 'center';
    ctx.fillText('PWNAGOTCHI', centerX, centerY - 15);

    // Draw networks
    networks.forEach((network, index) => {
      const angle = (index * 2 * Math.PI) / Math.max(networks.length, 1);
      const distance = 50 + (Math.abs(network.signal) / 100) * 150;
      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;

      // Network node
      const signalStrength = Math.max(0, (100 + network.signal) / 100);
      const nodeSize = 4 + signalStrength * 6;
      
      ctx.fillStyle = network.encryption === 'Open' ? '#ff0040' : 
                     network.encryption === 'WEP' ? '#ffff00' : '#00ff00';
      ctx.beginPath();
      ctx.arc(x, y, nodeSize, 0, 2 * Math.PI);
      ctx.fill();

      // Connection line
      ctx.strokeStyle = `rgba(0, 255, 255, ${signalStrength * 0.5})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.stroke();

      // Network label
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px Rajdhani';
      ctx.textAlign = 'center';
      ctx.fillText(network.ssid.substring(0, 10), x, y - nodeSize - 5);
    });

  }, [networks, scanRadius]);

  useEffect(() => {
    const interval = setInterval(() => {
      setScanRadius(prev => (prev + 5) % 200);
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`relative ${fullscreen ? 'h-full' : 'h-64'} cyber-panel rounded-lg overflow-hidden`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          // Handle network selection logic here
        }}
      />
      
      {/* Network List Overlay */}
      <div className="absolute top-4 right-4 w-80 max-h-96 overflow-y-auto scrollbar-cyber">
        <div className="cyber-panel rounded p-4 space-y-2">
          <h3 className="text-lg font-bold cyber-glow mb-3">DETECTED NETWORKS</h3>
          {networks.slice(-10).map((network) => (
            <motion.div
              key={network.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center justify-between p-2 rounded cyber-button hover:bg-cyan-400/10 cursor-pointer"
              onClick={() => setSelectedNetwork(network)}
            >
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-1">
                  {network.encryption === 'Open' ? 
                    <Unlock className="w-4 h-4 text-red-400" /> : 
                    <Lock className="w-4 h-4 text-green-400" />
                  }
                  <Wifi className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-mono">{network.ssid}</div>
                  <div className="text-xs text-cyan-300">{network.bssid}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-mono">{network.signal}dBm</div>
                <div className="text-xs text-cyan-300">CH{network.channel}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Network Details Modal */}
      {selectedNetwork && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-0 bg-black/80 flex items-center justify-center"
          onClick={() => setSelectedNetwork(null)}
        >
          <div className="cyber-panel rounded-lg p-6 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold cyber-glow mb-4">NETWORK DETAILS</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>SSID:</span>
                <span className="font-mono text-cyan-400">{selectedNetwork.ssid}</span>
              </div>
              <div className="flex justify-between">
                <span>BSSID:</span>
                <span className="font-mono text-cyan-400">{selectedNetwork.bssid}</span>
              </div>
              <div className="flex justify-between">
                <span>Channel:</span>
                <span className="font-mono text-cyan-400">{selectedNetwork.channel}</span>
              </div>
              <div className="flex justify-between">
                <span>Signal:</span>
                <span className="font-mono text-cyan-400">{selectedNetwork.signal}dBm</span>
              </div>
              <div className="flex justify-between">
                <span>Encryption:</span>
                <span className={`font-mono ${
                  selectedNetwork.encryption === 'Open' ? 'text-red-400' : 'text-green-400'
                }`}>
                  {selectedNetwork.encryption}
                </span>
              </div>
              <div className="flex justify-between">
                <span>First Seen:</span>
                <span className="font-mono text-cyan-400">
                  {new Date(selectedNetwork.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
            <div className="mt-6 flex space-x-3">
              <button className="flex-1 cyber-button py-2 rounded">
                <Eye className="w-4 h-4 mr-2" />
                MONITOR
              </button>
              <button className="flex-1 cyber-button py-2 rounded">
                <Shield className="w-4 h-4 mr-2" />
                ATTACK
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default NetworkMap;
