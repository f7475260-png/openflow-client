import React, { useState, useRef, useMemo, useEffect } from 'react';
import { 
  Play, Plus, Settings, X, Code, Trash2, Loader2, 
  CheckCircle2, Zap, Globe, MessageSquare, Clock, 
  Database, Bot, Save, Terminal, Search, ChevronRight, 
  Activity, Filter, Maximize2, Minimize2, 
  Copy, Download, Share2, MousePointer2, AlertCircle,
  Layers, Cpu
} from 'lucide-react';

// --- TYPES & CONSTANTES ---
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
  
  // Interaction State
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [activeConnection, setActiveConnection] = useState<{ sourceId: string, x: number, y: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Simulation d'exécution
  const addLog = (nodeId: string, message: string) => {
    setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, logs: [...n.logs, `[${new Date().toLocaleTimeString()}] ${message}`] } : n));
  };

  const runNode = async (nodeId: string, inputData: any): Promise<any> => {
    setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, state: 'running', inputData } : n));
    addLog(nodeId, `Traitement des données entrantes...`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    const output = { ...inputData, processed: true, value: Math.random() };
    setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, state: 'success', outputData: output } : n));
    addLog(nodeId, `Exécution terminée avec succès.`);
    return output;
  };

  const executeWorkflow = async () => {
    if (isExecuting) return;
    setIsExecuting(true);
    // Reset states
    setNodes(prev => prev.map(n => ({ ...n, state: 'idle', logs: [], outputData: {}, inputData: {} })));

    for (const node of nodes) {
      await runNode(node.id, { start: true });
    }
    setIsExecuting(false);
  };

  // Canvas Handlers
  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left - pan.x) / scale;
    const y = (e.clientY - rect.top - pan.y) / scale;

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
        <path key={edge.id} d={path} stroke="#6366f1" strokeWidth="3" fill="none" className="transition-all" strokeLinecap="round" />
      );
    });
  }, [edges, nodes]);

  return (
    <div className="flex h-screen w-full bg-[#0f172a] text-slate-200 overflow-hidden font-sans select-none">
      {/* Barre latérale gauche : Composants */}
      <aside className="w-72 bg-[#1e293b] border-r border-slate-800 flex flex-col z-30 shadow-2xl">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="bg-indigo-500 p-2 rounded-lg shadow-lg shadow-indigo-500/20">
            <Activity className="text-white" size={20} />
          </div>
          <h1 className="font-black text-xl tracking-tighter text-white">OPENFLOW</h1>
        </div>
        
        <div className="p-4 space-y-4 flex-1 overflow-y-auto">
          <div className="px-2">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Bibliothèque de Noeuds</p>
            <div className="grid gap-2">
              {Object.entries(NODE_TYPES).map(([type, info]) => (
                <div 
                  key={type}
                  onClick={() => setNodes(prev => [...prev, { 
                    id: `n-${Date.now()}`, 
                    type: type as NodeType, 
                    position: { x: 400 - pan.x, y: 300 - pan.y }, 
                    label: info.label, 
                    config: {}, 
                    state: 'idle', 
                    inputData: {}, 
                    outputData: {}, 
                    logs: [] 
                  }])}
                  className="group flex items-center gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700 hover:border-indigo-500 hover:bg-slate-800 cursor-pointer transition-all active:scale-95"
                >
                  <div className="p-2 rounded-lg bg-slate-900 group-hover:scale-110 transition-transform">
                    <info.icon size={16} style={{ color: info.color }} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">{info.label}</div>
                    <div className="text-[10px] text-slate-500">{info.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3 p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
            <Cpu className="text-indigo-400" size={16} />
            <div className="text-[10px] font-medium text-indigo-300">Statut du moteur: Prêt</div>
          </div>
        </div>
      </aside>

      {/* Zone de travail centrale */}
      <main className="flex-1 flex flex-col relative">
        <header className="h-16 border-b border-slate-800 bg-[#0f172a]/80 backdrop-blur-md flex items-center justify-between px-8 z-20">
          <div className="flex items-center gap-4">
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full border-2 border-[#0f172a] bg-emerald-500 flex items-center justify-center text-[10px] font-bold">JD</div>
              <div className="w-8 h-8 rounded-full border-2 border-[#0f172a] bg-indigo-500 flex items-center justify-center text-[10px] font-bold">ME</div>
            </div>
            <div className="h-4 w-px bg-slate-800" />
            <span className="text-sm font-medium text-slate-400">Projet / <span className="text-white">Automatisation_Vercel</span></span>
          </div>

          <div className="flex items-center gap-3">
            <button className="p-2 text-slate-400 hover:text-white transition-colors"><Share2 size={18} /></button>
            <button className="p-2 text-slate-400 hover:text-white transition-colors"><Settings size={18} /></button>
            <button 
              onClick={executeWorkflow}
              disabled={isExecuting}
              className="bg-indigo-600 px-6 py-2 rounded-lg text-xs font-black uppercase tracking-wider text-white hover:bg-indigo-500 disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all hover:-translate-y-0.5"
            >
              {isExecuting ? <Loader2 className="animate-spin" size={16} /> : <Play size={16} />}
              Lancer le Flow
            </button>
          </div>
        </header>

        {/* Canvas de dessin */}
        <div 
          ref={canvasRef}
          className="flex-1 relative bg-[#0f172a] overflow-hidden"
          onMouseMove={handleMouseMove}
          onMouseUp={() => { setDraggingNode(null); setActiveConnection(null); }}
          style={{ 
            backgroundImage: `radial-gradient(#334155 1px, transparent 1px)`, 
            backgroundSize: '30px 30px',
            backgroundPosition: `${pan.x}px ${pan.y}px`
          }}
        >
          <div className="absolute inset-0 origin-top-left" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})` }}>
            <svg className="absolute inset-0 w-[5000px] h-[5000px] pointer-events-none">
              {renderEdges}
              {activeConnection && (
                <line 
                  x1={activeConnection.x} y1={activeConnection.y} 
                  x2={activeConnection.x} y2={activeConnection.y} 
                  stroke="#6366f1" strokeWidth="2" strokeDasharray="5,5" 
                />
              )}
            </svg>

            {nodes.map(node => (
              <div
                key={node.id}
                style={{ left: node.position.x, top: node.position.y }}
                className={`absolute w-60 bg-[#1e293b] rounded-2xl border-2 p-4 cursor-pointer shadow-2xl transition-shadow ${selectedNodeId === node.id ? 'border-indigo-500 ring-4 ring-indigo-500/10' : 'border-slate-800'}`}
                onClick={(e) => { e.stopPropagation(); setSelectedNodeId(node.id); }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  setDraggingNode(node.id);
                  const rect = e.currentTarget.getBoundingClientRect();
                  setDragOffset({ x: (e.clientX - rect.left) / scale, y: (e.clientY - rect.top) / scale });
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-slate-900" style={{ color: NODE_TYPES[node.type].color }}>
                      {React.createElement(NODE_TYPES[node.type].icon, { size: 14 })}
                    </div>
                    <div className="text-[11px] font-black uppercase tracking-tight text-white">{node.label}</div>
                  </div>
                  {node.state === 'success' && <CheckCircle2 className="text-emerald-500" size={14} />}
                  {node.state === 'running' && <Loader2 className="text-indigo-500 animate-spin" size={14} />}
                </div>

                <div className="space-y-2 mb-2">
                  <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-500 ${node.state === 'success' ? 'w-full bg-emerald-500' : node.state === 'running' ? 'w-1/2 bg-indigo-500' : 'w-0'}`} />
                  </div>
                </div>
                
                <div className="text-[9px] font-mono text-slate-500 flex justify-between items-center">
                  <span>ID: {node.id.split('-')[0]}</span>
                  <span className="uppercase">{node.state}</span>
                </div>

                {/* Ports de connexion */}
                <div 
                  className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-slate-700 rounded-full border-2 border-slate-900 hover:bg-indigo-500 transition-colors z-10" 
                  onMouseDown={(e) => { 
                    e.stopPropagation(); 
                    setActiveConnection({ sourceId: node.id, x: node.position.x + 240, y: node.position.y + 60 }); 
                  }}
                />
                <div 
                  className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-slate-700 rounded-full border-2 border-slate-900 hover:bg-indigo-500 transition-colors z-10"
                  onMouseUp={() => { 
                    if (activeConnection && activeConnection.sourceId !== node.id) {
                      setEdges(prev => [...prev, { id: `e-${Date.now()}`, source: activeConnection.sourceId, target: node.id }]);
                    }
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Panneau de Logs */}
        <div className={`absolute bottom-0 w-full bg-[#1e293b] border-t border-slate-800 transition-all shadow-2xl z-20 ${viewLogs ? 'h-64' : 'h-12'}`}>
          <div className="h-12 px-8 flex items-center justify-between cursor-pointer hover:bg-slate-800/50 transition-colors" onClick={() => setViewLogs(!viewLogs)}>
            <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              <Terminal size={14} className="text-indigo-400" /> Console de Sortie
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
              </div>
              <ChevronRight className={`transition-transform duration-300 ${viewLogs ? 'rotate-90' : '-rotate-90'}`} size={16} />
            </div>
          </div>
          {viewLogs && (
            <div className="p-6 h-52 overflow-y-auto font-mono text-[11px] bg-black/30 mx-4 mb-4 rounded-xl border border-slate-800">
              {nodes.flatMap(n => n.logs).map((log, i) => (
                <div key={i} className="flex gap-4 py-1 border-b border-slate-800/50 last:border-0">
                  <span className="text-slate-600 shrink-0">[{i+1}]</span>
                  <span className="text-slate-300">{log}</span>
                </div>
              ))}
              {nodes.flatMap(n => n.logs).length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-2 opacity-50">
                  <Layers size={24} />
                  <div className="italic text-xs">Aucune activité enregistrée. Lancer le workflow pour voir les logs.</div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Barre latérale droite : Détails & Config */}
      <aside className={`w-80 bg-[#1e293b] border-l border-slate-800 p-8 flex flex-col gap-8 transition-all duration-500 shadow-2xl z-30 ${selectedNodeId ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 absolute right-0'}`}>
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <h2 className="text-xs font-black uppercase tracking-widest text-indigo-400">Propriétés</h2>
            <p className="text-[10px] text-slate-500 font-medium">Configurez votre noeud</p>
          </div>
          <button onClick={() => setSelectedNodeId(null)} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-2">
              <MousePointer2 size={12} /> Nom de l'instance
            </label>
            <input 
              type="text" 
              value={nodes.find(n => n.id === selectedNodeId)?.label || ''}
              onChange={(e) => setNodes(nds => nds.map(n => n.id === selectedNodeId ? { ...n, label: e.target.value } : n))}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
            />
          </div>

          <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
              <AlertCircle size={12} /> Info Technique
            </div>
            <div className="grid grid-cols-2 gap-2 text-[9px] font-mono">
              <div className="text-slate-500">TYPE</div>
              <div className="text-indigo-400">{nodes.find(n => n.id === selectedNodeId)?.type}</div>
              <div className="text-slate-500">X-POS</div>
              <div className="text-slate-300">{Math.round(nodes.find(n => n.id === selectedNodeId)?.position.x || 0)}</div>
              <div className="text-slate-500">Y-POS</div>
              <div className="text-slate-300">{Math.round(nodes.find(n => n.id === selectedNodeId)?.position.y || 0)}</div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Paramètres Avancés</label>
            <div className="p-4 bg-slate-800/50 rounded-xl border border-dashed border-slate-700 flex flex-col items-center justify-center gap-2 text-slate-600">
              <Code size={20} />
              <span className="text-[9px]">Aucune config spécifique</span>
            </div>
          </div>
        </div>

        <div className="mt-auto space-y-3">
          <button className="w-full py-3 bg-indigo-600 rounded-xl text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-2 hover:bg-indigo-500 transition-all">
            <Save size={16} /> Enregistrer
          </button>
          <button 
            onClick={() => { 
              setNodes(prev => prev.filter(n => n.id !== selectedNodeId)); 
              setEdges(prev => prev.filter(e => e.source !== selectedNodeId && e.target !== selectedNodeId)); 
              setSelectedNodeId(null); 
            }}
            className="w-full py-3 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-xl text-[10px] font-bold uppercase hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center gap-2"
          >
            <Trash2 size={16} /> Détruire le Noeud
          </button>
        </div>
      </aside>

      {/* Contrôles de vue flottants */}
      <div className="fixed bottom-10 left-80 flex gap-3 p-2 bg-[#1e293b]/80 backdrop-blur-md rounded-2xl border border-slate-800 shadow-2xl z-40">
        <button onClick={() => setScale(s => Math.min(2, s + 0.1))} className="p-3 bg-slate-800 rounded-xl border border-slate-700 hover:bg-indigo-500 transition-all"><Maximize2 size={16}/></button>
        <button onClick={() => setScale(1)} className="px-4 bg-slate-800 rounded-xl border border-slate-700 text-[10px] font-black">{Math.round(scale * 100)}%</button>
        <button onClick={() => setScale(s => Math.max(0.5, s - 0.1))} className="p-3 bg-slate-800 rounded-xl border border-slate-700 hover:bg-indigo-500 transition-all"><Minimize2 size={16}/></button>
        <div className="w-px bg-slate-700 mx-1" />
        <button onClick={() => { setPan({x:0, y:0}); setScale(1); }} className="p-3 bg-slate-800 rounded-xl border border-slate-700 hover:bg-indigo-500 transition-all"><Activity size={16}/></button>
      </div>
    </div>
  );
}
