
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster } from '@/components/ui/toaster';
import PwnagotchiDashboard from '@/components/PwnagotchiDashboard';

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <Helmet>
        <title>Pwnagotchi Cyber Interface</title>
        <meta name="description" content="Ultimate cyberpunk pwnagotchi monitoring and control interface" />
      </Helmet>
      
      <div className="min-h-screen bg-black text-cyan-400 overflow-hidden">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 flex items-center justify-center bg-black z-50"
            >
              <div className="text-center space-y-8">
                <motion.div
                  animate={{ 
                    rotate: 360,
                    scale: [1, 1.2, 1]
                  }}
                  transition={{ 
                    rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                    scale: { duration: 1, repeat: Infinity, ease: "easeInOut" }
                  }}
                  className="w-32 h-32 mx-auto relative"
                >
                  <div className="absolute inset-0 border-4 border-cyan-400 rounded-full opacity-20"></div>
                  <div className="absolute inset-2 border-4 border-magenta-500 rounded-full opacity-40"></div>
                  <div className="absolute inset-4 border-4 border-green-400 rounded-full opacity-60"></div>
                  <div className="absolute inset-6 bg-gradient-to-r from-cyan-400 to-magenta-500 rounded-full opacity-80 cyber-pulse"></div>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="space-y-4"
                >
                  <h1 className="text-4xl font-bold cyber-glow font-orbitron">
                    PWNAGOTCHI
                  </h1>
                  <p className="text-xl text-cyan-300 cyber-flicker">
                    INITIALIZING CYBER INTERFACE...
                  </p>
                  <div className="w-64 h-2 bg-black border border-cyan-400 rounded-full overflow-hidden mx-auto">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 2.5, ease: "easeInOut" }}
                      className="h-full bg-gradient-to-r from-cyan-400 via-green-400 to-magenta-500 cyber-progress-bar"
                    />
                  </div>
                </motion.div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <PwnagotchiDashboard />
            </motion.div>
          )}
        </AnimatePresence>
        
        <Toaster />
      </div>
    </>
  );
}

export default App;
