import React, { useState, useRef, useMemo } from 'react';
import { 
  Play, Plus, Settings, X, Code, Trash2, Loader2, 
  CheckCircle2, Zap, Globe, MessageSquare, Clock, 
  Database, Bot, Save, Terminal, Search, ChevronRight, 
  Activity, ZapOff, Filter, Maximize2, Minimize2, 
  Copy, Download
} from 'lucide-react';

// --- TYPES & CONSTANTS ---
type NodeType = 'webhook' | 'cron' | 'javascript' | 'openai' | 'discord' | 'database' | 'filter' | 'http';

interface NodeData {
  id: string;
  type: NodeType;
  position: { x: number, y: number };
  label: string;
  config: Record<string, any>;
  state: 'idle' | 'running' | 'success' | 'error' | 'waiting';
  inputData: any;
  outputData: any;
  logs: string[];
}

interface Edge {
  id: string;
  source: string;
  target: string;
}

const THEME = {
  bg: '#0f172a',
  panel: '#1e293b',
  border: '#334155',
  accent: '#6366f1'
};

const NODE_TYPES: Record<NodeType, any> = {
  webhook: { icon: Globe, color: '#10b981', label: 'Webhook', desc: 'Déclencheur HTTP' },
  cron: { icon: Clock, color: '#3b82f6', label: 'Schedule', desc: 'Exécution planifiée' },
  javascript: { icon: Code, color: '#f59e0b', label: 'JS Script', desc: 'Transformation' },
  openai: { icon: Bot, color: '#8b5cf6', label: 'AI Agent', desc: 'LLM Processing' },
  discord: { icon: MessageSquare, color: '#6366f1', label: 'Discord', desc: 'Notifications' },
  database: { icon: Database, color: '#f43f5e', label: 'Database', desc: 'Lecture/Écriture' },
  filter: { icon: Filter, color: '#ec4899', label: 'Filter', desc: 'Logique' },
  http: { icon: Zap, color: '#06b6d4', label: 'HTTP Request', desc: 'Appel API' }
};

export default function App() {
  // Graph State
  const [nodes, setNodes] = useState<NodeData[]>([
    { 
      id: 'n1', type: 'webhook', position: { x: 100, y: 150 }, label: 'Entrée API', 
      config: { url: '/hooks/v1' }, state: 'idle', inputData: {}, outputData: {}, logs: [] 
    }
  ]);
  const [edges, setEdges] = useState<Edge[]>([]);
  
  // UI State
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [viewLogs, setViewLogs] = useState(true);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  
  // Interaction State
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [activeConnection, setActiveConnection] = useState<{ sourceId: string, x: number, y: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const addLog = (nodeId: string, message: string) => {
    setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, logs: [...n.logs, `[${new Date().toLocaleTimeString()}] ${message}`] } : n));
  };

  const runNode = async (nodeId: string, inputData: any): Promise<any> => {
    setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, state: 'running', inputData } : n));
    addLog(nodeId, `Traitement en cours...`);
    await new Promise(resolve => setTimeout(resolve, 800));
    const output = { ...inputData, timestamp: Date.now() };
    setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, state: 'success', outputData: output } : n));
    addLog(nodeId, `Succès.`);
    return output;
  };

  const executeWorkflow = async () => {
    if (isExecuting) return;
    setIsExecuting(true);
    setNodes(prev => prev.map(n => ({ ...n, state: 'idle', logs: [], outputData: {}, inputData: {} })));

    if (nodes.length > 0) {
      const firstNode = nodes[0];
      const result = await runNode(firstNode.id, { init: true });
      
      const nextEdges = edges.filter(e => e.source === firstNode.id);
      for (const edge of nextEdges) {
        await runNode(edge.target, result);
      }
    }
    setIsExecuting(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left - pan.x) / scale;
    const y = (e.clientY - rect.top - pan.y) / scale;

    if (isPanning) {
      setPan(prev => ({ x: prev.x + e.movementX, y: prev.y + e.movementY }));
    }
    if (draggingNode) {
      setNodes(prev => prev.map(n => n.id === draggingNode ? { 
        ...n, position: { x: x - dragOffset.x, y: y - dragOffset.y } 
      } : n));
    }
    if (activeConnection) {
      setActiveConnection(prev => prev ? { ...prev, x, y } : null);
    }
  };

  const renderEdges = useMemo(() => {
    return edges.map(edge => {
      const source = nodes.find(n => n.id === edge.source);
      const target = nodes.find(n => n.id === edge.target);
      if (!source || !target) return null;

      const x1 = source.position.x + 240;
      const y1 = source.position.y + 60;
      const x2 = target.position.x;
      const y2 = target.position.y + 60;
      const dx = Math.abs(x1 - x2) * 0.5;
      const path = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;

      return (
        <path key={edge.id} d={path} stroke={THEME.accent} strokeWidth="3" fill="none" className="transition-all" />
      );
    });
  }, [edges, nodes]);

  return (
    <div className="flex h-screen w-full bg-[#0f172a] text-slate-200 overflow-hidden font-sans select-none">
      <aside className="w-72 bg-[#1e293b] border-r border-slate-800 flex flex-col z-30">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <Activity className="text-indigo-500" size={24} />
          <h1 className="font-black text-xl tracking-tighter">OPENFLOW</h1>
        </div>
        <div className="p-4 space-y-2 flex-1 overflow-y-auto">
          {Object.entries(NODE_TYPES).map(([type, info]) => (
            <div 
              key={type}
              onClick={() => setNodes(prev => [...prev, { id: `n-${Date.now()}`, type: type as NodeType, position: { x: 400 - pan.x, y: 300 - pan.y }, label: info.label, config: {}, state: 'idle', inputData: {}, outputData: {}, logs: [] }])}
              className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700 hover:border-indigo-500 cursor-pointer transition-all"
            >
              <info.icon size={18} style={{ color: info.color }} />
              <div className="text-xs font-bold">{info.label}</div>
            </div>
          ))}
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative">
        <nav className="h-16 border-b border-slate-800 bg-[#0f172a]/80 backdrop-blur-md flex items-center justify-between px-8 z-20">
          <span className="text-sm font-medium text-slate-400">Workflow / <span className="text-white">Main_Process</span></span>
          <div className="flex items-center gap-3">
            <button 
              onClick={executeWorkflow}
              disabled={isExecuting}
              className="bg-indigo-600 px-6 py-2 rounded-lg text-xs font-black uppercase hover:bg-indigo-500 disabled:opacity-50 flex items-center gap-2"
            >
              {isExecuting ? <Loader2 className="animate-spin" size={16} /> : <Play size={16} />}
              Run
            </button>
          </div>
        </nav>

        <div 
          ref={canvasRef}
          className="flex-1 relative bg-[#0f172a] overflow-hidden"
          onMouseDown={(e) => { if (e.button === 1) setIsPanning(true); }}
          onMouseMove={handleMouseMove}
          onMouseUp={() => { setIsPanning(false); setDraggingNode(null); setActiveConnection(null); }}
          style={{ backgroundImage: `radial-gradient(${THEME.border} 1px, transparent 1px)`, backgroundSize: '30px 30px', backgroundPosition: `${pan.x}px ${pan.y}px` }}
        >
          <div className="absolute inset-0 origin-top-left" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})` }}>
            <svg className="absolute inset-0 w-[5000px] h-[5000px]">
              {renderEdges}
            </svg>
            {nodes.map(node => (
              <div
                key={node.id}
                style={{ left: node.position.x, top: node.position.y }}
                className={`absolute w-60 bg-[#1e293b] rounded-2xl border-2 p-4 cursor-pointer shadow-xl ${selectedNodeId === node.id ? 'border-indigo-500' : 'border-slate-800'}`}
                onClick={() => setSelectedNodeId(node.id)}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  setDraggingNode(node.id);
                  const rect = e.currentTarget.getBoundingClientRect();
                  setDragOffset({ x: (e.clientX - rect.left) / scale, y: (e.clientY - rect.top) / scale });
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded bg-slate-900" style={{ color: NODE_TYPES[node.type].color }}>{React.createElement(NODE_TYPES[node.type].icon, { size: 14 })}</div>
                  <div className="text-[11px] font-black uppercase truncate">{node.label}</div>
                </div>
                <div className={`text-[10px] font-mono ${node.state === 'success' ? 'text-emerald-400' : 'text-slate-500'}`}>{node.state}</div>
                
                <div 
                  className="absolute -right-2 top-1/2 w-4 h-4 bg-slate-700 rounded-full border-2 border-slate-900 hover:bg-indigo-500" 
                  onMouseDown={(e) => { e.stopPropagation(); setActiveConnection({ sourceId: node.id, x: node.position.x + 240, y: node.position.y + 60 }); }}
                />
                <div 
                  className="absolute -left-2 top-1/2 w-4 h-4 bg-slate-700 rounded-full border-2 border-slate-900 hover:bg-indigo-500"
                  onMouseUp={() => { if (activeConnection && activeConnection.sourceId !== node.id) setEdges(prev => [...prev, { id: `e-${Date.now()}`, source: activeConnection.sourceId, target: node.id }]); }}
                />
              </div>
            ))}
          </div>
        </div>

        <div className={`absolute bottom-0 w-full bg-[#1e293b] border-t border-slate-800 transition-all ${viewLogs ? 'h-48' : 'h-10'}`}>
          <div className="h-10 px-6 flex items-center justify-between cursor-pointer" onClick={() => setViewLogs(!viewLogs)}>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest"><Terminal size={14} /> Console</div>
            <ChevronRight className={viewLogs ? 'rotate-90' : '-rotate-90'} size={14} />
          </div>
          {viewLogs && (
            <div className="p-4 h-36 overflow-y-auto font-mono text-[10px] space-y-1 bg-black/20">
              {nodes.flatMap(n => n.logs).map((log, i) => <div key={i} className="text-slate-400">{log}</div>)}
              {nodes.flatMap(n => n.logs).length === 0 && <div className="text-slate-600 italic">En attente d'exécution...</div>}
            </div>
          )}
        </div>
      </main>

      <aside className={`w-80 bg-[#1e293b] border-l border-slate-800 p-6 flex flex-col gap-6 transition-transform ${selectedNodeId ? '' : 'translate-x-full absolute right-0'}`}>
        <div className="flex justify-between items-center">
          <h2 className="text-xs font-black uppercase">Configuration</h2>
          <X size={16} className="cursor-pointer" onClick={() => setSelectedNodeId(null)} />
        </div>
        <div className="space-y-4">
          <label className="text-[10px] font-bold text-slate-500 uppercase">Label</label>
          <input 
            type="text" 
            value={nodes.find(n => n.id === selectedNodeId)?.label || ''}
            onChange={(e) => setNodes(nds => nds.map(n => n.id === selectedNodeId ? { ...n, label: e.target.value } : n))}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs"
          />
        </div>
        <button 
          onClick={() => { setNodes(prev => prev.filter(n => n.id !== selectedNodeId)); setEdges(prev => prev.filter(e => e.source !== selectedNodeId && e.target !== selectedNodeId)); setSelectedNodeId(null); }}
          className="mt-auto py-2 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-lg text-[10px] font-bold uppercase hover:bg-rose-500 hover:text-white transition-all"
        >
          Supprimer le noeud
        </button>
      </aside>

      <div className="fixed bottom-14 right-6 flex gap-2">
        <button onClick={() => setScale(s => Math.min(2, s + 0.1))} className="p-2 bg-slate-800 rounded-lg border border-slate-700"><Maximize2 size={14}/></button>
        <button onClick={() => setScale(s => Math.max(0.5, s - 0.1))} className="p-2 bg-slate-800 rounded-lg border border-slate-700"><Minimize2 size={14}/></button>
      </div>
    </div>
  );
}
