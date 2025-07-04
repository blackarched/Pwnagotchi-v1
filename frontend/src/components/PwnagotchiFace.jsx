import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const faces = {
  awake: '(◕‿‿◕)',
  bored: '(-__-)',
  intense: '(°▃▃°)',
  cool: '(⌐■_■)',
  happy: '(◕‿◕)',
  excited: '(ᵔ◡ᵔ)',
  motivated: '(☼‿‿☼)',
  demotivated: '(≖__≖)',
  smart: '(✜‿‿✜)',
  lonely: '(ب__ب)',
  sad: '(╥☁╥ )',
  angry: '(╥﹏╥)',
  friend: '(♥‿‿♥)',
  broken: '(☓‿‿☓)',
  debug: '(#__#)',
  sleep: '(⇀‿‿↼)',
};

const PwnagotchiFace = ({ mood }) => {
  const [currentFace, setCurrentFace] = useState(faces.awake);
  const [blinking, setBlinking] = useState(false);

  useEffect(() => {
    setCurrentFace(faces[mood] || faces.awake);
  }, [mood]);

  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlinking(true);
      setTimeout(() => setBlinking(false), 150);
    }, 3000 + Math.random() * 2000);

    return () => clearInterval(blinkInterval);
  }, []);

  const faceToRender = blinking ? '(⇀‿‿↼)' : currentFace;

  return (
    <div className="font-mono text-4xl text-cyan-400 cyber-glow h-12 flex items-center justify-center">
      <AnimatePresence mode="wait">
        <motion.div
          key={faceToRender}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
        >
          {faceToRender}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default PwnagotchiFace;