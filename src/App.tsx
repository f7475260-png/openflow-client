import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Play, 
  Trash2, 
  Activity, 
  Globe, 
  MessageSquare, 
  Clock, 
  FileJson,
  CheckCircle,
  XCircle,
  Loader2,
  Sparkles,
  Database,
  Zap,
  Layers,
  Search,
  Mail,
  HardDrive,
  AlertTriangle,
  X,
  Plus
} from 'lucide-react';

// --- Types & Configuration ---

type NodeType = 'webhook' | 'httpRequest' | 'discord' | 'wait' | 'json' | 'ai' | 'gmail' | 'memory';

interface NodeConfig {
  [key: string]: any;
}

interface NodeData {
  id: string;
  type: NodeType;
  x: number;
  y: number;
  config: NodeConfig;
  status: 'idle' | 'running' | 'success' | 'error';
  output?: any;
}

interface EdgeData {
  id: string;
  source: string;
  target: string;
}

const NODE_TYPES: Record<NodeType, any> = {
  webhook: {
    label: 'Webhook',
    category: 'Triggers',
    icon: Globe,
    color: '#8357FF',
    initialConfig: { method: 'GET', path: '/webhook/incoming' },
  },
  gmail: {
    label: 'Gmail',
    category: 'Communication',
    icon: Mail,
    color: '#EA4335',
    initialConfig: { 
      mode: 'simulation',
      operation: 'read', 
      limit: 3, 
      accessToken: '', 
    },
  },
  ai: {
    label: 'IA Gemini',
    category: 'AI',
    icon: Sparkles,
    color: '#00A3FF',
    initialConfig: { 
      systemPrompt: "Tu es un assistant personnel intelligent.", 
      userPrompt: "Analyse cet email et propose une réponse courte : {{input}}" 
    },
  },
  memory: {
    label: 'Mémoire (DB)',
    category: 'Storage',
    icon: HardDrive,
    color: '#FF9F43',
    initialConfig: { 
      operation: 'write',
      key: 'contexte_client',
      value: '{{input}}'
    },
  },
  httpRequest: {
    label: 'HTTP Request',
    category: 'Services',
    icon: Activity,
    color: '#FF4D4D',
    initialConfig: { url: 'https://jsonplaceholder.typicode.com/todos/1', method: 'GET' },
  },
  wait: {
    label: 'Attendre',
    category: 'Flow',
    icon: Clock,
    color: '#FFB800',
    initialConfig: { ms: 1500 },
  },
  json: {
    label: 'Code / JSON',
    category: 'Transform',
    icon: FileJson,
    color: '#00D1FF',
    initialConfig: { json: '{"processed": true}' },
  }
};

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export default function App() {
  // --- État Global ---
  const [nodes, setNodes] = useState<NodeData[]>([
    { id: 'start_1', type: 'webhook', x: 100, y: 200, config: NODE_TYPES.webhook.initialConfig, status: 'idle' },
    { id: 'gmail_1', type: 'gmail', x: 400, y: 200, config: NODE_TYPES.gmail.initialConfig, status: 'idle' },
    { id: 'ai_1', type: 'ai', x: 700, y: 200, config: NODE_TYPES.ai.initialConfig, status: 'idle' }
  ]);
  const [edges, setEdges] = useState<EdgeData[]>([
    { id: 'e1', source: 'start_1', target: 'gmail_1' },
    { id: 'e2', source: 'gmail_1', target: 'ai_1' }
  ]);
  
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [dragInfo, setDragInfo] = useState<{id: string, startX: number, startY: number} | null>(null);
  const [connecting, setConnecting] = useState<{id: string, x: number, y: number} | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [logs, setLogs] = useState<any[]>([]);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [memoryStore, setMemoryStore] = useState<Record<string, any>>({});
  
  const canvasRef = useRef<HTMLDivElement>(null);

  const addLog = (msg: string, type: 'info' | 'error' = 'info') => {
    setLogs(prev => [{ t: new Date().toLocaleTimeString(), msg, type }, ...prev.slice(0, 49)]);
  };

  // --- Mouvement et Interaction ---
  const onMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });

    if (dragInfo) {
      setNodes(nds => nds.map(n => n.id === dragInfo.id ? { ...n, x: x - 100, y: y - 40 } : n));
    }
  };

  const createNode = (type: NodeType) => {
    const id = `${type}_${Math.random().toString(36).substr(2, 5)}`;
    const newNode: NodeData = {
      id,
      type,
      x: mousePos.x > 0 ? mousePos.x - 100 : 200,
      y: mousePos.y > 0 ? mousePos.y - 40 : 200,
      config: { ...NODE_TYPES[type].initialConfig },
      status: 'idle'
    };
    setNodes(prev => [...prev, newNode]);
    setSelectedId(id);
    setShowAddMenu(false);
  };

  const updateConfig = (id: string, newConfig: any) => {
    setNodes(nds => nds.map(n => n.id === id ? { ...n, config: { ...n.config, ...newConfig } } : n));
  };

  // --- Moteur d'Exécution ---
  const execute = async () => {
    if (isExecuting) return;
    setIsExecuting(true);
    addLog("Démarrage du workflow...");
    
    setNodes(nds => nds.map(n => ({ ...n, status: 'idle', output: null })));
    
    // Trouver les points de départ
    let queue = nodes
      .filter(n => !edges.some(e => e.target === n.id))
      .map(n => ({ id: n.id, input: {} }));

    if (queue.length === 0 && nodes.length > 0) queue = [{ id: nodes[0].id, input: {} }];

    const processedMemory = { ...memoryStore };

    while (queue.length > 0) {
      const { id, input } = queue.shift()!;
      const node = nodes.find(n => n.id === id);
      if (!node) continue;

      setNodes(nds => nds.map(n => n.id === id ? { ...n, status: 'running' } : n));
      await sleep(1000);

      try {
        let output: any = {};

        // Simulation de la logique des nœuds
        switch (node.type) {
          case 'ai':
            output = { text: "[Simulation IA] Analyse effectuée avec succès.", model: "gemini-2.5-flash" };
            break;
          case 'gmail':
            output = node.config.operation === 'read' 
              ? { emails: [{ from: "test@demo.com", subject: "Hello" }], count: 1 }
              : { sent: true };
            break;
          case 'memory':
            if (node.config.operation === 'write') {
              processedMemory[node.config.key] = JSON.stringify(input);
              setMemoryStore({...processedMemory});
              output = { success: true };
            } else {
              output = { value: processedMemory[node.config.key] || "Non trouvé" };
            }
            break;
          case 'wait':
            await sleep(node.config.ms || 1000);
            output = input;
            break;
          default:
            output = { ...input, processed: true };
        }

        setNodes(nds => nds.map(n => n.id === id ? { ...n, status: 'success', output } : n));
        
        // Ajouter les nœuds suivants à la file
        const nextEdges = edges.filter(e => e.source === id);
        nextEdges.forEach(e => queue.push({ id: e.target, input: output }));

      } catch (err: any) {
        setNodes(nds => nds.map(n => n.id === id ? { ...n, status: 'error' } : n));
        addLog(`Erreur sur ${id}: ${err.message}`, 'error');
      }
    }

    setIsExecuting(false);
    addLog("Workflow terminé.");
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#F8FAFC] text-slate-900 overflow-hidden font-sans">
      
      {/* Barre de navigation */}
      <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-1.5 rounded-lg text-white shadow-sm">
            <Zap size={20} fill="currentColor" />
          </div>
          <h1 className="font-bold text-lg tracking-tight">OpenFlow Automation</h1>
        </div>
        
        <button 
          onClick={execute}
          disabled={isExecuting}
          className={`flex items-center gap-2 px-5 py-2 rounded-full font-semibold text-sm transition-all shadow-sm ${isExecuting ? 'bg-slate-100 text-slate-400' : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'}`}
        >
          {isExecuting ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} fill="currentColor" />}
          {isExecuting ? 'Exécution...' : 'Lancer le Workflow'}
        </button>
      </header>

      <div className="flex flex-1 relative overflow-hidden">
        
        {/* Barre latérale (Menu) */}
        <aside className="w-16 bg-white border-r border-slate-200 flex flex-col items-center py-6 gap-6 z-40">
          <button className="p-3 text-indigo-600 bg-indigo-50 rounded-xl" title="Workflows"><Layers size={22} /></button>
          <button className="p-3 text-slate-400 hover:bg-slate-50 rounded-xl transition-colors" title="Data"><Database size={22} /></button>
          <div className="flex-1" />
          <button className="p-3 text-slate-400 hover:bg-slate-50 rounded-xl transition-colors" title="Search"><Search size={22} /></button>
        </aside>

        {/* Espace de travail (Canvas) */}
        <main 
          ref={canvasRef}
          className="flex-1 relative bg-slate-50 overflow-hidden cursor-grab active:cursor-grabbing"
          onMouseMove={onMouseMove}
          onMouseUp={() => { setDragInfo(null); setConnecting(null); }}
          style={{ 
            backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }}
        >
          <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
            {edges.map(edge => {
              const s = nodes.find(n => n.id === edge.source);
              const t = nodes.find(n => n.id === edge.target);
              if (!s || !t) return null;
              return (
                <path 
                  key={edge.id}
                  d={`M ${s.x + 200} ${s.y + 40} C ${s.x + 280} ${s.y + 40}, ${t.x - 80} ${t.y + 40}, ${t.x} ${t.y + 40}`}
                  stroke={selectedId === s.id || selectedId === t.id ? "#6366f1" : "#94a3b8"} 
                  strokeWidth="2.5" fill="none"
                />
              );
            })}
            {connecting && (
              <path 
                d={`M ${connecting.x} ${connecting.y} C ${connecting.x + 80} ${connecting.y}, ${mousePos.x - 80} ${mousePos.y}, ${mousePos.x} ${mousePos.y}`}
                stroke="#6366f1" strokeWidth="2" strokeDasharray="5" fill="none"
              />
            )}
          </svg>

          {nodes.map(node => {
            const config = NODE_TYPES[node.type];
            const isSelected = selectedId === node.id;
            
            return (
              <div 
                key={node.id}
                onMouseDown={() => { setSelectedId(node.id); setDragInfo({ id: node.id, startX: node.x, startY: node.y }); }}
                style={{ left: node.x, top: node.y }}
                className={`absolute w-52 bg-white rounded-xl shadow-sm border-2 transition-all flex flex-col ${isSelected ? 'border-indigo-500 shadow-md ring-4 ring-indigo-500/10 z-20' : 'border-slate-200 z-10'}`}
              >
                {/* Indicateur de statut */}
                <div className="absolute -top-2 -right-2 z-30">
                   {node.status === 'success' && <div className="bg-emerald-500 rounded-full p-1 border-2 border-white text-white"><CheckCircle size={14} /></div>}
                   {node.status === 'error' && <div className="bg-rose-500 rounded-full p-1 border-2 border-white text-white"><XCircle size={14} /></div>}
                   {node.status === 'running' && <div className="bg-indigo-500 rounded-full p-1 border-2 border-white text-white animate-spin"><Loader2 size={14} /></div>}
                </div>

                <div className="flex items-center gap-3 p-3 border-b border-slate-50">
                  <div className="p-2 rounded-lg text-white" style={{ backgroundColor: config.color }}>
                    <config.icon size={18} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-700">{config.label}</span>
                    <span className="text-[10px] text-slate-400 font-mono">#{node.id.split('_')[1]}</span>
                  </div>
                </div>

                {/* Ports de connexion */}
                <div 
                  className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-slate-300 rounded-full cursor-crosshair hover:border-indigo-500 hover:bg-indigo-500 transition-colors"
                  onMouseDown={(e) => { e.stopPropagation(); setConnecting({ id: node.id, x: node.x + 200, y: node.y + 40 }); }}
                />
                <div 
                  className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-slate-300 rounded-full cursor-crosshair hover:border-indigo-500"
                  onMouseUp={(e) => { e.stopPropagation(); if (connecting && connecting.id !== node.id) setEdges(prev => [...prev, { id: `e_${Date.now()}`, source: connecting.id, target: node.id }]); }}
                />
              </div>
            );
          })}

          {/* Bouton d'ajout flottant */}
          <div className="absolute bottom-6 right-6 flex flex-col items-end gap-3">
            {showAddMenu && (
              <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-2 grid grid-cols-2 gap-1 animate-in fade-in slide-in-from-bottom-4 duration-200 mb-2">
                {Object.keys(NODE_TYPES).map(type => (
                  <button 
                    key={type}
                    onClick={() => createNode(type as NodeType)}
                    className="flex items-center gap-3 px-4 py-2 hover:bg-slate-50 rounded-xl transition-colors text-left"
                  >
                    <div className="p-1.5 rounded text-white" style={{ backgroundColor: NODE_TYPES[type as NodeType].color }}>
                      {React.createElement(NODE_TYPES[type as NodeType].icon, { size: 14 })}
                    </div>
                    <span className="text-xs font-medium text-slate-600">{NODE_TYPES[type as NodeType].label}</span>
                  </button>
                ))}
              </div>
            )}
            <button 
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="w-14 h-14 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
            >
              {showAddMenu ? <X size={24} /> : <Plus size={24} />}
            </button>
          </div>
        </main>

        {/* Panneau de configuration (Droit) */}
        {selectedId && (
          <aside className="w-80 bg-white border-l border-slate-200 shadow-xl z-50 flex flex-col animate-in slide-in-from-right duration-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-sm">Configuration</h2>
              <button onClick={() => setSelectedId(null)} className="p-1 text-slate-400 hover:bg-slate-50 rounded"><X size={18} /></button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto space-y-6">
              {(() => {
                const node = nodes.find(n => n.id === selectedId);
                if (!node) return null;
                
                return (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="p-2 rounded-lg text-white" style={{ backgroundColor: NODE_TYPES[node.type].color }}>
                           {React.createElement(NODE_TYPES[node.type].icon, { size: 16 })}
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{node.type}</span>
                    </div>

                    {node.type === 'ai' && (
                      <div className="space-y-4">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Prompt Système</label>
                          <textarea 
                            className="w-full p-3 text-xs border border-slate-200 rounded-lg h-20 outline-none focus:border-indigo-500"
                            value={node.config.systemPrompt}
                            onChange={(e) => updateConfig(node.id, { systemPrompt: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Requête</label>
                          <textarea 
                            className="w-full p-3 text-xs border border-slate-200 rounded-lg h-24 outline-none focus:border-indigo-500 font-mono"
                            value={node.config.userPrompt}
                            onChange={(e) => updateConfig(node.id, { userPrompt: e.target.value })}
                          />
                        </div>
                      </div>
                    )}

                    {/* Zone de logs / sortie JSON */}
                    <div className="mt-6 pt-6 border-t border-slate-100">
                      <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Dernier Résultat</label>
                      <div className="bg-slate-900 rounded-lg p-3 overflow-x-auto min-h-[100px]">
                        {node.output ? (
                          <pre className="text-[10px] font-mono text-emerald-400 leading-tight">
                            {JSON.stringify(node.output, null, 2)}
                          </pre>
                        ) : (
                          <div className="text-[10px] text-slate-500 italic">Aucune donnée...</div>
                        )}
                      </div>
                    </div>

                    <button 
                      onClick={() => {
                        setNodes(nds => nds.filter(n => n.id !== selectedId));
                        setEdges(eds => eds.filter(e => e.source !== selectedId && e.target !== selectedId));
                        setSelectedId(null);
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-rose-500 bg-rose-50 rounded-lg hover:bg-rose-100 transition-colors"
                    >
                      <Trash2 size={14} /> Supprimer le nœud
                    </button>
                  </div>
                );
              })()}
            </div>
          </aside>
        )}

        {/* Console de logs (Bas) */}
        <div className="absolute bottom-4 left-20 w-72 bg-slate-900/90 backdrop-blur rounded-xl shadow-2xl p-3 font-mono text-[9px] z-30 border border-slate-800">
           <div className="flex justify-between items-center mb-2 text-slate-500 uppercase font-bold tracking-widest border-b border-slate-800 pb-1">
             <span>Console</span>
             <button onClick={() => setLogs([])}><Trash2 size={10} /></button>
           </div>
           <div className="h-20 overflow-y-auto space-y-1">
              {logs.map((l, i) => (
                <div key={i} className={l.type === 'error' ? 'text-rose-400' : 'text-indigo-300'}>
                  <span className="text-slate-600 mr-1">[{l.t}]</span> {l.msg}
                </div>
              ))}
              {logs.length === 0 && <div className="text-slate-700 italic">Système prêt.</div>}
           </div>
        </div>
      </div>
    </div>
  );
}
