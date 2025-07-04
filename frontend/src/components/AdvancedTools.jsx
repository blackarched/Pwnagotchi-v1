import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldOff, Target, Play, Wifi, List, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const AdvancedTools = ({ networks = [], onStartAttack }) => {
  const { toast } = useToast();
  const [targetNetwork, setTargetNetwork] = useState(null);
  const [isAttacking, setIsAttacking] = useState(false);
  const [attackPackets, setAttackPackets] = useState([]);

  const handleStartAttack = async () => {
    if (!targetNetwork) {
      toast({
        variant: "destructive",
        title: "No Target Selected",
        description: "Please select a target network first.",
      });
      return;
    }

    setIsAttacking(true);
    setAttackPackets([]);
    
    const response = await onStartAttack(targetNetwork);

    if (response && response.success) {
      const attackInterval = setInterval(() => {
        setAttackPackets(prev => [...prev.slice(-100), {
          id: Date.now() + Math.random(),
          time: new Date().toLocaleTimeString(),
          type: 'Deauth',
          target: 'ff:ff:ff:ff:ff:ff',
        }]);
      }, 500);

      setTimeout(() => {
        clearInterval(attackInterval);
        setIsAttacking(false);
        toast({
          title: "Deauth Attack Finished",
          description: `Attack on ${targetNetwork.ssid} completed.`,
        });
      }, 10000);
    } else {
      setIsAttacking(false);
    }
  };

  const availableNetworks = networks.filter(n => n.encryption !== 'Open');

  return (
    <div className="h-full flex gap-6">
      <div className="w-1/3 flex flex-col gap-6">
        <div className="cyber-panel rounded-lg p-6">
          <h2 className="text-xl font-bold cyber-glow mb-4 flex items-center">
            <ShieldOff className="mr-2" /> Deauth Attack
          </h2>
          <p className="text-sm text-cyan-300 mb-4">
            Send deauthentication frames to a network to disconnect all clients. Use responsibly.
          </p>
          <Button 
            onClick={handleStartAttack} 
            disabled={isAttacking || !targetNetwork}
            className="w-full cyber-button cyber-button-destructive text-base"
          >
            <Play className="w-5 h-5 mr-2" />
            {isAttacking ? 'ATTACKING...' : 'START ATTACK'}
          </Button>
        </div>

        <div className="cyber-panel rounded-lg p-6 flex-1">
          <h2 className="text-xl font-bold cyber-glow mb-4 flex items-center">
            <Target className="mr-2" /> Select Target
          </h2>
          <div className="h-[calc(100%-40px)] overflow-y-auto scrollbar-cyber">
            {availableNetworks.length > 0 ? availableNetworks.map(network => (
              <motion.div
                key={network.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => setTargetNetwork(network)}
                className={`flex items-center justify-between p-3 mb-2 rounded transition-all cursor-pointer ${
                  targetNetwork?.id === network.id 
                    ? 'bg-red-500/30 border border-red-500' 
                    : 'cyber-panel hover:bg-cyan-400/10'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Wifi className="w-4 h-4" />
                  <span className="font-mono text-sm">{network.ssid}</span>
                </div>
                <span className="text-xs text-cyan-300">{network.bssid}</span>
              </motion.div>
            )) : (
              <div className="text-center py-8 text-cyan-300">
                <AlertTriangle className="mx-auto w-8 h-8 mb-2" />
                <p>No suitable networks found.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="w-2/3 cyber-panel rounded-lg p-6 flex flex-col">
        <h2 className="text-xl font-bold cyber-glow mb-4 flex items-center">
          <List className="mr-2" /> Attack Log
        </h2>
        <div className="flex-1 cyber-terminal rounded p-4 overflow-y-auto scrollbar-cyber">
          {!isAttacking && attackPackets.length === 0 && (
            <div className="h-full flex items-center justify-center text-center text-cyan-300">
              <div>
                <ShieldOff className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p>Awaiting attack command.</p>
                <p className="text-sm">Select a target and start the attack.</p>
              </div>
            </div>
          )}
          <AnimatePresence>
            {attackPackets.map(packet => (
              <motion.div
                key={packet.id}
                initial={{ opacity: 0, x: -20, height: 0 }}
                animate={{ opacity: 1, x: 0, height: 'auto' }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="flex items-center space-x-4 text-sm font-mono mb-1"
              >
                <span className="text-cyan-400/60 w-24">{packet.time}</span>
                <span className="text-red-400 w-20">[{packet.type}]</span>
                <span className="text-cyan-300">Sent to BSSID: {targetNetwork?.bssid} (Client: {packet.target})</span>
              </motion.div>
            ))}
          </AnimatePresence>
          {isAttacking && (
            <div className="text-green-400 font-mono animate-pulse">
              Sending packets...<span className="blinking-cursor">|</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdvancedTools;