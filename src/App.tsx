import React, { useState, useRef, useEffect, useMemo } from 'react';
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
  accent: '#6366f1',
  text: '#f1f5f9',
  textMuted: '#94a3b8'
};

const NODE_TYPES: Record<NodeType, any> = {
  webhook: { icon: Globe, color: '#10b981', label: 'Webhook', desc: 'Déclencheur HTTP POST/GET' },
  cron: { icon: Clock, color: '#3b82f6', label: 'Schedule', desc: 'Exécution planifiée' },
  javascript: { icon: Code, color: '#f59e0b', label: 'JS Script', desc: 'Transformation de données' },
  openai: { icon: Bot, color: '#8b5cf6', label: 'AI Agent', desc: 'Génération par LLM' },
  discord: { icon: MessageSquare, color: '#6366f1', label: 'Discord', desc: 'Notification channel' },
  database: { icon: Database, color: '#f43f5e', label: 'PostgreSQL', desc: 'Lecture/Écriture DB' },
  filter: { icon: Filter, color: '#ec4899', label: 'Filter', desc: 'Logique conditionnelle' },
  http: { icon: Zap, color: '#06b6d4', label: 'HTTP Request', desc: 'Appel API externe' }
};

// --- MAIN COMPONENT ---
export default function App() {
  // Graph State
  const [nodes, setNodes] = useState<NodeData[]>([
    { 
      id: 'n1', type: 'webhook', position: { x: 100, y: 200 }, label: 'Entrée API', 
      config: { url: '/hooks/v1/trigger' }, state: 'idle', inputData: {}, outputData: {}, logs: [] 
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
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // --- ENGINE LOGIC ---
  
  const addLog = (nodeId: string, message: string) => {
    setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, logs: [...n.logs, `[${new Date().toLocaleTimeString()}] ${message}`] } : n));
  };

  // Scroll automatique vers le bas des logs
  useEffect(() => {
    if (viewLogs && terminalEndRef.current) {
        terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [nodes, viewLogs]);

  const runNode = async (nodeId: string, inputData: any): Promise<any> => {
    setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, state: 'running', inputData } : n));
    addLog(nodeId, `Début de l'exécution avec les données: ${JSON.stringify(inputData).substring(0, 50)}...`);

    // Simulation de latence réseau/calcul
    await new Promise(resolve => setTimeout(resolve, 1200 + Math.random() * 1000));

    let output = { ...inputData, processedAt: new Date().toISOString(), nodeId };
    
    // Logique spécifique simplifiée
    const node = nodes.find(n => n.id === nodeId);
    if (node?.type === 'javascript') output.result = "Script exécuté avec succès";
    if (node?.type === 'openai') output.ai_response = "Ceci est une réponse générée par l'IA simulée.";

    setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, state: 'success', outputData: output } : n));
    addLog(nodeId, `Succès. Sortie générée.`);
    return output;
  };

  const executeWorkflow = async () => {
    if (isExecuting) return;
    setIsExecuting(true);
    
    // Reset states
    setNodes(prev => prev.map(n => ({ ...n, state: 'idle', logs: [], outputData: {}, inputData: {} })));

    // Simple Linear Execution for Demo (BFS)
    const queue: { id: string, data: any }[] = [{ id: nodes[0].id, data: { start: true } }];
    const processed = new Set();

    while (queue.length > 0) {
      const { id, data } = queue.shift()!;
      if (processed.has(id)) continue;
      processed.add(id);

      const result = await runNode(id, data);
      
      const nextEdges = edges.filter(e => e.source === id);
      nextEdges.forEach(edge => {
        queue.push({ id: edge.target, data: result });
      });
    }

    setIsExecuting(false);
  };

  // --- INTERACTION HANDLERS ---

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setIsPanning(true);
    }
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
        ...n, 
        position: { x: x - dragOffset.x, y: y - dragOffset.y } 
      } : n));
    }

    if (activeConnection) {
      setActiveConnection(prev => prev ? { ...prev, x, y } : null);
    }
  };

  const handleMouseUp = () => {
    setDraggingNode(null);
    setIsPanning(false);
    setActiveConnection(null);
  };

  const startConnection = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    setActiveConnection({ sourceId: nodeId, x: node.position.x + 240, y: node.position.y + 60 });
  };

  const completeConnection = (targetId: string) => {
    if (activeConnection && activeConnection.sourceId !== targetId) {
      const newEdge: Edge = {
        id: `e-${Date.now()}`,
        source: activeConnection.sourceId,
        target: targetId
      };
      setEdges(prev => [...prev, newEdge]);
    }
    setActiveConnection(null);
  };

  const addNewNode = (type: NodeType) => {
    const newNode: NodeData = {
      id: `n-${Date.now()}`,
      type,
      position: { x: 400 - pan.x, y: 300 - pan.y },
      label: NODE_TYPES[type].label,
      config: {},
      state: 'idle',
      inputData: {},
      outputData: {},
      logs: []
    };
    setNodes(prev => [...prev, newNode]);
  };

  // --- RENDERING HELPERS ---

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
        <g key={edge.id} className="group">
          <path 
            d={path} 
            stroke={THEME.border} 
            strokeWidth="8" 
            fill="none" 
            className="opacity-0 group-hover:opacity-20 transition-opacity cursor-pointer"
            onClick={() => setEdges(prev => prev.filter(e => e.id !== edge.id))}
          />
          <path 
            d={path} 
            stroke={source.state === 'success' ? '#10b981' : THEME.accent} 
            strokeWidth="3" 
            fill="none" 
            className="transition-all duration-500"
          />
        </g>
      );
    });
  }, [edges, nodes]);

  return (
    <div className="flex h-screen w-full bg-[#0f172a] text-slate-200 overflow-hidden select-none font-sans">
      
      {/* SIDEBAR: LIBRARY */}
      <aside className="w-72 bg-[#1e293b] border-r border-slate-800 flex flex-col z-30">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Activity className="text-white" size={24} />
          </div>
          <div>
            <h1 className="font-black text-xl tracking-tighter text-white">OPENFLOW</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Engine v3.5.0</p>
          </div>
        </div>

        <div className="p-4 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
            <input 
              type="text" 
              placeholder="Rechercher un noeud..." 
              className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 pl-9 pr-4 text-xs focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Bibliothèque</h2>
            {Object.entries(NODE_TYPES).map(([type, info]) => (
              <div 
                key={type}
                onClick={() => addNewNode(type as NodeType)}
                className="group flex items-center gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800 hover:border-indigo-500/50 hover:shadow-lg transition-all cursor-pointer"
              >
                <div className="p-2 rounded-lg bg-slate-900 text-white" style={{ color: info.color }}>
                  <info.icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs font-bold text-slate-200">{info.label}</h3>
                  <p className="text-[10px] text-slate-500 truncate">{info.desc}</p>
                </div>
                <Plus size={14} className="text-slate-600 group-hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-all" />
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mb-2">
            <span>UTILISATION CPU</span>
            <span>12%</span>
          </div>
          <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 w-[12%]" />
          </div>
        </div>
      </aside>

      {/* MAIN CANVAS AREA */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        
        {/* TOP TOOLBAR */}
        <nav className="h-16 border-b border-slate-800 bg-[#0f172a]/80 backdrop-blur-md flex items-center justify-between px-8 z-20">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-full border border-slate-700">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
              <span className="text-[11px] font-bold">PROD_ENV</span>
            </div>
            <div className="h-4 w-px bg-slate-800" />
            <div className="flex items-center gap-1 font-medium text-sm">
              <span className="text-slate-500">Workflows /</span>
              <span className="text-white">Marketing_Automation_v1</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700 mr-4">
              <button onClick={() => setScale(s => Math.min(2, s + 0.1))} className="p-1.5 hover:bg-slate-700 rounded-md transition-colors"><Maximize2 size={14}/></button>
              <div className="px-2 flex items-center text-[10px] font-mono text-slate-400">{Math.round(scale * 100)}%</div>
              <button onClick={() => setScale(s => Math.max(0.5, s - 0.1))} className="p-1.5 hover:bg-slate-700 rounded-md transition-colors"><Minimize2 size={14}/></button>
            </div>
            
            <button className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800 rounded-lg border border-slate-700 transition-all">
              <Save size={14} /> Sauvegarder
            </button>
            <button 
              onClick={executeWorkflow}
              disabled={isExecuting}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-black tracking-tighter uppercase transition-all shadow-xl shadow-indigo-500/10 ${
                isExecuting 
                ? 'bg-slate-800 text-slate-500 border border-slate-700' 
                : 'bg-indigo-600 text-white hover:bg-indigo-500 hover:-translate-y-0.5 active:translate-y-0'
              }`}
            >
              {isExecuting ? <Loader2 className="animate-spin" size={16} /> : <Play size={16} fill="currentColor" />}
              {isExecuting ? 'Exécution en cours' : 'Lancer le flux'}
            </button>
          </div>
        </nav>

        {/* WORKSPACE */}
        <div 
          ref={canvasRef}
          className={`flex-1 relative overflow-hidden bg-[#0f172a] transition-all ${isPanning ? 'cursor-grabbing' : 'cursor-crosshair'}`}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          style={{
            backgroundImage: `radial-gradient(${THEME.border} 1px, transparent 1px)`,
            backgroundSize: `${30 * scale}px ${30 * scale}px`,
            backgroundPosition: `${pan.x}px ${pan.y}px`
          }}
        >
          <div 
            className="absolute inset-0 origin-top-left pointer-events-none"
            style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})` }}
          >
            <svg className="absolute inset-0 w-[5000px] h-[5000px] pointer-events-auto">
              {renderEdges}
              {activeConnection && (
                <line 
                  x1={activeConnection.x} y1={activeConnection.y} 
                  x2={activeConnection.x + (activeConnection.x - activeConnection.x)} y2={activeConnection.y} 
                  stroke={THEME.accent} strokeWidth="3" strokeDasharray="5,5" 
                />
              )}
            </svg>

            {nodes.map(node => {
              const info = NODE_TYPES[node.type];
              const isSelected = selectedNodeId === node.id;
              
              return (
                <div
                  key={node.id}
                  style={{ left: node.position.x, top: node.position.y }}
                  className={`absolute w-60 bg-[#1e293b] rounded-2xl border-2 pointer-events-auto transition-all duration-200 group shadow-2xl ${
                    isSelected ? 'border-indigo-500 ring-4 ring-indigo-500/10 z-20' : 'border-slate-800 z-10'
                  } ${node.state === 'running' ? 'scale-[1.02] border-indigo-400' : ''}`}
                  onClick={(e) => { e.stopPropagation(); setSelectedNodeId(node.id); }}
                >
                  {/* IN PORT */}
                  <div 
                    onMouseUp={() => completeConnection(node.id)}
                    className="absolute -left-3 top-[60px] w-6 h-6 flex items-center justify-center cursor-pointer group/port"
                  >
                    <div className="w-2.5 h-2.5 bg-slate-900 border-2 border-slate-600 rounded-full group-hover/port:border-indigo-500 group-hover/port:scale-125 transition-all" />
                  </div>

                  {/* HEADER */}
                  <div 
                    className="p-4 flex items-center gap-3 border-b border-slate-800/50 cursor-grab active:cursor-grabbing"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setDraggingNode(node.id);
                      const rect = e.currentTarget.getBoundingClientRect();
                      setDragOffset({ 
                        x: (e.clientX - rect.left) / scale, 
                        y: (e.clientY - rect.top) / scale 
                      });
                    }}
                  >
                    <div className="p-2 rounded-xl bg-slate-900 shadow-inner" style={{ color: info.color }}>
                      <info.icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-100 truncate">{node.label}</h4>
                      <p className="text-[9px] text-slate-500 font-bold uppercase">{node.type}</p>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${
                      node.state === 'success' ? 'bg-emerald-500' : 
                      node.state === 'running' ? 'bg-indigo-500 animate-pulse' : 
                      node.state === 'error' ? 'bg-rose-500' : 'bg-slate-700'
                    }`} />
                  </div>

                  {/* BODY */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">État</span>
                      <span className={`text-[10px] font-mono ${node.state === 'success' ? 'text-emerald-400' : 'text-slate-400'}`}>
                        {node.state.toUpperCase()}
                      </span>
                    </div>
                    <div className="h-px bg-slate-800" />
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Dernière Sortie</span>
                      <div className="bg-slate-900/50 p-2 rounded-lg text-[10px] font-mono text-slate-400 truncate border border-slate-800">
                        {node.outputData && Object.keys(node.outputData).length > 0 
                          ? JSON.stringify(node.outputData) 
                          : 'null'}
                      </div>
                    </div>
                  </div>

                  {/* OUT PORT */}
                  <div 
                    onMouseDown={(e) => startConnection(e, node.id)}
                    className="absolute -right-3 top-[60px] w-6 h-6 flex items-center justify-center cursor-pointer group/port"
                  >
                    <div className="w-2.5 h-2.5 bg-slate-900 border-2 border-slate-600 rounded-full group-hover/port:border-indigo-500 group-hover/port:scale-125 transition-all" />
                  </div>

                  {/* NODE ACTIONS */}
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all pointer-events-none group-hover:pointer-events-auto">
                    <button className="p-2 bg-slate-800 border border-slate-700 rounded-lg hover:text-white transition-colors shadow-xl">
                      <Copy size={12} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setNodes(prev => prev.filter(n => n.id !== node.id)); }}
                      className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-xl"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* LOGS PANEL */}
        <div className={`absolute bottom-0 left-0 right-0 bg-[#0f172a] border-t border-slate-800 transition-all z-40 ${viewLogs ? 'h-64' : 'h-10'}`}>
          <div 
            className="h-10 px-6 flex items-center justify-between bg-slate-900/50 cursor-pointer hover:bg-slate-800 transition-colors"
            onClick={() => setViewLogs(!viewLogs)}
          >
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <Terminal size={14} /> Console de Sortie
            </div>
            <div className="flex items-center gap-4">
              <span className="text-[10px] text-slate-500 font-mono">Total Nodes: {nodes.length} | Edges: {edges.length}</span>
              {viewLogs ? <ChevronRight className="rotate-90" size={16}/> : <ChevronRight className="-rotate-90" size={16}/>}
            </div>
          </div>
          
          {viewLogs && (
            <div className="p-4 h-52 overflow-y-auto font-mono text-[11px] space-y-1 bg-black/20 custom-scrollbar" ref={terminalEndRef}>
              {nodes.flatMap(n => n.logs).length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-50">
                  <ZapOff size={32} className="mb-2" />
                  <p>Aucun log d'exécution disponible. Lancez le workflow pour voir les données circuler.</p>
                </div>
              ) : (
                nodes.flatMap(n => n.logs.map(l => ({ msg: l, id: n.id, type: n.type }))).map((log, i) => (
                  <div key={i} className="flex gap-3 py-0.5 border-b border-slate-800/30 hover:bg-white/5 px-2 rounded">
                    <span className="text-slate-600 shrink-0">[{log.id}]</span>
                    <span className="text-indigo-400 font-bold shrink-0 uppercase">{log.type}</span>
                    <span className="text-slate-300">{log.msg}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </main>

      {/* INSPECTION PANEL (RIGHT) */}
      <aside className={`w-[400px] bg-[#1e293b] border-l border-slate-800 flex flex-col z-30 transition-transform duration-300 shadow-2xl ${selectedNodeId ? 'translate-x-0' : 'translate-x-full absolute right-0'}`}>
        {selectedNodeId && (
          <>
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/30">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
                  <Settings size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-black text-white uppercase tracking-tighter">Configuration</h2>
                  <p className="text-[10px] text-slate-500 font-bold">{selectedNodeId}</p>
                </div>
              </div>
              <button onClick={() => setSelectedNodeId(null)} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
              {/* NOM DU NOEUD */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nom de l'affichage</label>
                <input 
                  type="text" 
                  value={nodes.find(n => n.id === selectedNodeId)?.label || ''}
                  onChange={(e) => setNodes(nds => nds.map(n => n.id === selectedNodeId ? { ...n, label: e.target.value } : n))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              {/* JSON CONFIG */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Paramètres JSON</label>
                  <button className="text-[9px] font-bold text-indigo-400 hover:underline">Formatage Auto</button>
                </div>
                <div className="relative group">
                  <textarea 
                    value={JSON.stringify(nodes.find(n => n.id === selectedNodeId)?.config, null, 2)}
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value);
                        setNodes(nds => nds.map(n => n.id === selectedNodeId ? { ...n, config: parsed } : n));
                      } catch (err) {}
                    }}
                    rows={8}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-xs font-mono focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                  />
                  <div className="absolute right-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Code size={14} className="text-slate-600" />
                  </div>
                </div>
              </div>

              {/* DYNAMIC DATA VIEWER */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Données de Sortie (Dernier Run)</label>
                <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 overflow-hidden">
                  <pre className="text-[10px] font-mono text-emerald-400 whitespace-pre-wrap">
                    {JSON.stringify(nodes.find(n => n.id === selectedNodeId)?.outputData, null, 2)}
                  </pre>
                </div>
              </div>

              {/* OPTIONS TOGGLES */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-2">Paramètres de Flux</h3>
                {[
                  { label: 'Continuer si erreur', desc: 'Ne stoppe pas le workflow si ce noeud échoue.' },
                  { label: 'Exécution Parallèle', desc: 'Lance les noeuds suivants simultanément.' },
                  { label: 'Mode Debug', desc: 'Affiche des logs détaillés dans la console.' }
                ].map((opt, i) => (
                  <div key={i} className="flex items-start justify-between group cursor-pointer">
                    <div className="flex-1">
                      <p className="text-xs font-bold text-slate-200">{opt.label}</p>
                      <p className="text-[10px] text-slate-500">{opt.desc}</p>
                    </div>
                    <div className="w-10 h-5 bg-slate-800 border border-slate-700 rounded-full relative mt-1">
                      <div className="absolute left-1 top-1 w-3 h-3 bg-slate-500 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 border-t border-slate-800 bg-slate-900/30 grid grid-cols-2 gap-3">
              <button className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all border border-slate-700 flex items-center justify-center gap-2">
                <Download size={14} /> Exporter
              </button>
              <button 
                onClick={() => setSelectedNodeId(null)}
                className="py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={14} /> Appliquer
              </button>
            </div>
          </>
        )}
      </aside>

      {/* STYLES CSS PERSONNALISÉS */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #475569;
        }
        @keyframes pulse-indigo {
          0%, 100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4); }
          50% { box-shadow: 0 0 0 10px rgba(99, 102, 241, 0); }
        }
        .node-running {
          animation: pulse-indigo 2s infinite;
        }
      `}</style>
    </div>
  );
}
