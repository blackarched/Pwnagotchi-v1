import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Send, Trash2, Download, Copy, Rss } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const TerminalInterface = ({ logs = [], onSendCommand }) => {
  const { toast } = useToast();
  const [activeView, setActiveView] = useState('command');
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState([]);
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const terminalRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    setHistory([
      { id: Date.now(), type: 'system', content: 'Pwnagotchi Terminal Interface v3.0', timestamp: new Date().toISOString() },
      { id: Date.now() + 1, type: 'system', content: 'Type "help" for commands or switch to Live Logs view.', timestamp: new Date().toISOString() }
    ]);
    if (inputRef.current) inputRef.current.focus();
  }, []);

  useEffect(() => {
    if (terminalRef.current) terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
  }, [history, logs, activeView]);

  const executeCommand = async (cmd) => {
    const trimmedCmd = cmd.trim();
    if (!trimmedCmd) return;

    if (!commandHistory.includes(trimmedCmd)) setCommandHistory(prev => [trimmedCmd, ...prev.slice(0, 49)]);
    setHistoryIndex(-1);
    const commandEntry = { id: Date.now(), type: 'command', content: `$ ${cmd}`, timestamp: new Date().toISOString() };
    
    if (trimmedCmd.toLowerCase() === 'clear') {
      setHistory([]);
      return;
    }

    const output = await onSendCommand(trimmedCmd);
    const outputEntry = { id: Date.now() + 1, type: 'output', content: output, timestamp: new Date().toISOString() };
    setHistory(prev => [...prev, commandEntry, outputEntry]);
  };

  const handleSubmit = (e) => { e.preventDefault(); if (command.trim()) { executeCommand(command); setCommand(''); } };
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowUp') { e.preventDefault(); if (historyIndex < commandHistory.length - 1) { const newIndex = historyIndex + 1; setHistoryIndex(newIndex); setCommand(commandHistory[newIndex]); } }
    else if (e.key === 'ArrowDown') { e.preventDefault(); if (historyIndex > 0) { const newIndex = historyIndex - 1; setHistoryIndex(newIndex); setCommand(commandHistory[newIndex]); } else if (historyIndex === 0) { setHistoryIndex(-1); setCommand(''); } }
  };
  const handleClearHistory = () => { setHistory([]); toast({ title: "Terminal Cleared", description: "Command history cleared" }); };
  const handleCopyOutput = () => {
    const textToCopy = activeView === 'logs' ? logs.map(l => l.message).join('\n') : history.map(h => h.content).join('\n');
    navigator.clipboard.writeText(textToCopy).then(() => toast({ title: "Copied to Clipboard" }));
  };
  const handleExportLogs = () => {
    const textToExport = activeView === 'logs' ? logs.map(l => `[${new Date(l.timestamp).toLocaleTimeString()}] [${l.level}] ${l.message}`).join('\n') : history.map(h => `[${new Date(h.timestamp).toLocaleTimeString()}] ${h.content}`).join('\n');
    const blob = new Blob([textToExport], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'pwnagotchi-terminal-logs.txt'; a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Logs Exported" });
  };

  const getLogLevelColor = (level) => {
    switch (level) {
      case 'INFO': return 'text-blue-400';
      case 'WARN': return 'text-yellow-400';
      case 'ERROR': return 'text-red-400';
      case 'DEBUG': return 'text-green-400';
      case 'SUCCESS': return 'text-green-400';
      case 'CMD': return 'text-purple-400';
      default: return 'text-cyan-300';
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="cyber-panel rounded-t-lg p-3 border-b border-cyan-400/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center bg-black/50 border border-cyan-400/30 rounded">
              <button onClick={() => setActiveView('command')} className={`px-3 py-1 text-xs font-mono flex items-center space-x-2 rounded-l ${activeView === 'command' ? 'bg-cyan-400/20 text-cyan-400' : 'text-cyan-300'}`}><Terminal className="w-4 h-4"/><span>COMMANDS</span></button>
              <button onClick={() => setActiveView('logs')} className={`px-3 py-1 text-xs font-mono flex items-center space-x-2 rounded-r ${activeView === 'logs' ? 'bg-cyan-400/20 text-cyan-400' : 'text-cyan-300'}`}><Rss className="w-4 h-4"/><span>LIVE LOGS</span></button>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button size="sm" onClick={handleCopyOutput} className="cyber-button text-sm px-2 py-1"><Copy className="w-4 h-4" /></Button>
            <Button size="sm" onClick={handleExportLogs} className="cyber-button text-sm px-2 py-1"><Download className="w-4 h-4" /></Button>
            <Button size="sm" onClick={handleClearHistory} className="cyber-button cyber-button-destructive text-sm px-2 py-1"><Trash2 className="w-4 h-4" /></Button>
          </div>
        </div>
      </div>
      <div ref={terminalRef} className="flex-1 cyber-terminal rounded-none p-4 overflow-y-auto scrollbar-cyber font-mono text-sm">
        <AnimatePresence mode="wait">
          {activeView === 'command' ? (
            <motion.div key="command-view" initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}}>
              {history.map((entry) => (
                <motion.div key={entry.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`mb-2 ${entry.type === 'command' ? 'text-cyan-400' : entry.type === 'system' ? 'text-green-400' : 'text-cyan-300'}`}>
                  <pre className="whitespace-pre-wrap break-words">{entry.content}</pre>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div key="logs-view" initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}}>
              {logs.map((log) => (
                <motion.div key={log.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-start space-x-3 mb-1">
                  <span className="text-cyan-400/50 text-xs w-20 shrink-0">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  <span className={`w-12 shrink-0 px-2 py-0.5 rounded text-xs text-center ${getLogLevelColor(log.level)} bg-black/30`}>{log.level}</span>
                  <pre className={`whitespace-pre-wrap break-words ${getLogLevelColor(log.level)}`}>{log.message}</pre>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <AnimatePresence>
      {activeView === 'command' && (
        <motion.div initial={{y: "100%", opacity: 0}} animate={{y: 0, opacity: 1}} exit={{y: "100%", opacity: 0}} className="cyber-panel rounded-b-lg p-4 border-t border-cyan-400/30">
          <form onSubmit={handleSubmit} className="flex items-center space-x-3">
            <span className="text-cyan-400 font-mono">$</span>
            <input ref={inputRef} type="text" value={command} onChange={(e) => setCommand(e.target.value)} onKeyDown={handleKeyDown} placeholder="Enter command..." className="flex-1 bg-transparent border-none outline-none text-cyan-400 font-mono placeholder-cyan-400/50" autoComplete="off" />
            <Button type="submit" size="sm" className="cyber-button text-sm px-2 py-1"><Send className="w-4 h-4" /></Button>
          </form>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
};

export default TerminalInterface;