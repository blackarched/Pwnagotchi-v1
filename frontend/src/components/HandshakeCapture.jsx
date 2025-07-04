import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Download, Eye, Trash2, Search, Filter, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import * as api from '@/lib/api';

const HandshakeCapture = ({ handshakes = [] }) => {
  const { toast } = useToast();
  const [capturedHandshakes, setCapturedHandshakes] = useState(handshakes);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  React.useEffect(() => {
    setCapturedHandshakes(handshakes);
  }, [handshakes]);

  const filteredHandshakes = capturedHandshakes.filter(handshake => {
    const matchesFilter = filter === 'all' || handshake.status === filter;
    const matchesSearch = handshake.ssid.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         handshake.bssid.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleDownload = (handshake) => {
    toast({
      title: "Download Started",
      description: `Downloading handshake for ${handshake.ssid}`,
    });
  };

  const handleDelete = (id) => {
    setCapturedHandshakes(prev => prev.filter(h => h.id !== id));
    toast({
      title: "Handshake Deleted",
      description: "Handshake removed from storage",
    });
  };

  const handleAnalyze = (handshake) => {
    toast({
      title: "Analysis Started",
      description: `Analyzing handshake for ${handshake.ssid}`,
    });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="cyber-panel rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold cyber-glow">HANDSHAKE CAPTURE</h2>
          <div className="flex items-center space-x-4">
            <div className="text-sm font-mono">
              TOTAL: <span className="text-cyan-400">{capturedHandshakes.length}</span>
            </div>
            <div className="text-sm font-mono">
              COMPLETE: <span className="text-green-400">
                {capturedHandshakes.filter(h => h.status === 'complete').length}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-cyan-400" />
            <input
              type="text"
              placeholder="Search handshakes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-black/50 border border-cyan-400/30 rounded px-3 py-1 text-sm font-mono focus:border-cyan-400 focus:outline-none"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-cyan-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-black/50 border border-cyan-400/30 rounded px-3 py-1 text-sm font-mono focus:border-cyan-400 focus:outline-none"
            >
              <option value="all">All</option>
              <option value="complete">Complete</option>
              <option value="partial">Partial</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 cyber-panel rounded-lg p-6 overflow-hidden">
        <div className="h-full overflow-y-auto scrollbar-cyber">
          <div className="space-y-3">
            {filteredHandshakes.map((handshake) => (
              <motion.div
                key={handshake.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="cyber-panel rounded p-4 hover:bg-cyan-400/5 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      {handshake.status === 'complete' ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : handshake.status === 'partial' ? (
                        <Clock className="w-5 h-5 text-yellow-400" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-400" />
                      )}
                      <Lock className="w-4 h-4 text-cyan-400" />
                    </div>

                    <div>
                      <div className="font-mono text-lg text-cyan-400">{handshake.ssid}</div>
                      <div className="text-sm text-cyan-300 space-x-4">
                        <span>BSSID: {handshake.bssid}</span>
                        <span>Client: {handshake.client}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6">
                    <div className="text-right text-sm font-mono">
                      <div className="text-cyan-400">{handshake.encryption}</div>
                      <div className="text-cyan-300">{handshake.signal}dBm</div>
                    </div>

                    <div className="text-right text-sm font-mono">
                      <div className="text-cyan-400">{(handshake.size / 1024).toFixed(1)}KB</div>
                      <div className="text-cyan-300">
                        {new Date(handshake.timestamp).toLocaleTimeString()}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleAnalyze(handshake)}
                        className="cyber-button text-sm px-2 py-1"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleDownload(handshake)}
                        className="cyber-button text-sm px-2 py-1"
                        disabled={handshake.status !== 'complete'}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleDelete(handshake.id)}
                        className="cyber-button cyber-button-destructive text-sm px-2 py-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {handshake.status === 'partial' && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-cyan-300 mb-1">
                      <span>Capture Progress</span>
                      <span>75%</span>
                    </div>
                    <div className="h-1 bg-black/50 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: '75%' }}
                        className="h-full bg-gradient-to-r from-yellow-400 to-orange-500"
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            ))}

            {filteredHandshakes.length === 0 && (
              <div className="text-center py-12 text-cyan-300">
                <Lock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No handshakes captured yet</p>
                <p className="text-sm">Monitoring networks for WPA handshakes...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HandshakeCapture;