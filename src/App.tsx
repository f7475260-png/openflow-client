import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, Plus, Search, Settings, MoreHorizontal, X, 
  Zap, Globe, Mail, MessageSquare, Database, Clock, 
  Code, Cpu, Layers, Trash2, Save, Share2, Bell
} from 'lucide-react';

// --- Configuration Design & Données ---

const NODE_VARIANTS = {
  webhook: { label: 'Webhook', icon: Globe, color: 'from-pink-500 to-rose-500', shadow: 'shadow-pink-500/20' },
  gmail: { label: 'Gmail', icon: Mail, color: 'from-red-500 to-orange-500', shadow: 'shadow-red-500/20' },
  ai: { label: 'AI Agent', icon: Cpu, color: 'from-violet-500 to-purple-500', shadow: 'shadow-violet-500/20' },
  code: { label: 'JavaScript', icon: Code, color: 'from-yellow-400 to-orange-400', shadow: 'shadow-orange-500/20' },
  discord: { label: 'Discord', icon: MessageSquare, color: 'from-indigo-500 to-blue-500', shadow: 'shadow-indigo-500/20' },
  wait: { label: 'Timer', icon: Clock, color: 'from-emerald-400 to-teal-500', shadow: 'shadow-emerald-500/20' },
  db: { label: 'Postgres', icon: Database, color: 'from-blue-400 to-cyan-400', shadow: 'shadow-cyan-500/20' },
};

export default function App() {
  const [nodes, setNodes] = useState([
    { id: '1', type: 'webhook', x: 100, y: 300, data: { label: 'Start Trigger' } },
    { id: '2', type: 'ai', x: 450, y: 300, data: { label: 'Summarize Email' } },
    { id: '3', type: 'discord', x: 800, y: 300, data: { label: 'Notify Team' } },
  ]);
  
  const [edges, setEdges] = useState([
    { id: 'e1', source: '1', target: '2' },
    { id: 'e2', source: '2', target: '3' },
  ]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  
  // Dragging Logic (Simplifié pour la démo)
  const [dragNode, setDragNode] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragNode && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - 120; // Centrer curseur
      const y = e.clientY - rect.top - 40;
      setNodes(nds => nds.map(n => n.id === dragNode ? { ...n, x, y } : n));
    }
  };

  return (
    <div className="flex h-screen w-screen bg-[#0f1117] text-white font-sans overflow-hidden selection:bg-orange-500/30">
      
      {/* --- SIDEBAR --- */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-[#13151b] border-r border-white/5 transition-all duration-300 flex flex-col z-20`}>
        <div className="h-16 flex items-center px-6 border-b border-white/5 gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Zap size={18} className="text-white" fill="currentColor"/>
          </div>
          {isSidebarOpen && <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">OpenFlow</span>}
        </div>

        <div className="p-4 flex-1 space-y-6 overflow-y-auto">
          {/* Menu Items */}
          <div className="space-y-1">
            <MenuItem icon={Layers} label="Workflows" active isOpen={isSidebarOpen} />
            <MenuItem icon={Database} label="Credentials" isOpen={isSidebarOpen} />
            <MenuItem icon={Settings} label="Settings" isOpen={isSidebarOpen} />
          </div>

          {/* Draggable Templates */}
          {isSidebarOpen && (
            <div className="pt-6 border-t border-white/5 animate-in fade-in duration-500">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Bibliothèque</h3>
              <div className="grid grid-cols-1 gap-2">
                {Object.entries(NODE_VARIANTS).map(([key, val]) => (
                  <button key={key} onClick={() => {
                    const id = Math.random().toString();
                    setNodes([...nodes, { id, type: key, x: 200, y: 200, data: { label: val.label } }]);
                    setSelectedId(id);
                  }} 
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/5 transition-all group">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${val.color} flex items-center justify-center`}>
                      <val.icon size={14} className="text-white" />
                    </div>
                    <span className="text-sm text-gray-300 group-hover:text-white">{val.label}</span>
                    <Plus size={14} className="ml-auto text-gray-600 group-hover:text-white" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <div className="flex-1 flex flex-col relative bg-[#0f1117]">
        
        {/* HEADER */}
        <header className="h-16 border-b border-white/5 bg-[#0f1117]/80 backdrop-blur-md flex items-center justify-between px-6 z-10 absolute top-0 w-full">
          <div className="flex items-center gap-4">
             <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <h1 className="font-semibold text-gray-200">Automatisation Client V2</h1>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">Actif</span>
                </div>
                <span className="text-xs text-gray-500">Dernière exécution : il y a 2 min</span>
             </div>
          </div>
          <div className="flex items-center gap-3">
             <button className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"><Share2 size={18}/></button>
             <button className="px-4 py-2 bg-white text-black rounded-lg text-sm font-bold hover:bg-gray-200 transition-colors flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                <Play size={14} fill="currentColor"/> Exécuter
             </button>
          </div>
        </header>

        {/* CANVAS */}
        <main 
          ref={canvasRef}
          className="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing"
          onMouseMove={handleMouseMove}
          onMouseUp={() => setDragNode(null)}
          style={{ 
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)', 
            backgroundSize: '30px 30px',
            backgroundPosition: '-10px -10px'
          }}
        >
          {/* Infinite Grid Fade Effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0f1117] via-transparent to-[#0f1117] pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0f1117] via-transparent to-[#0f1117] pointer-events-none" />

          {/* SVG CONNECTIONS */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
            <defs>
              <linearGradient id="gradientWait" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#64748b" />
                <stop offset="100%" stopColor="#64748b" />
              </linearGradient>
            </defs>
            {edges.map(edge => {
              const s = nodes.find(n => n.id === edge.source);
              const t = nodes.find(n => n.id === edge.target);
              if (!s || !t) return null;
              
              const sx = s.x + 240; const sy = s.y + 40;
              const tx = t.x; const ty = t.y + 40;
              
              return (
                <g key={edge.id}>
                  {/* Glow Effect */}
                  <path d={`M ${sx} ${sy} C ${sx + 80} ${sy}, ${tx - 80} ${ty}, ${tx} ${ty}`} stroke="rgba(255,255,255,0.05)" strokeWidth="8" fill="none" />
                  {/* Line */}
                  <path 
                    d={`M ${sx} ${sy} C ${sx + 80} ${sy}, ${tx - 80} ${ty}, ${tx} ${ty}`} 
                    stroke="url(#gradientWait)" strokeWidth="2" fill="none" 
                    className="animate-[dash_1s_linear_infinite]"
                  />
                </g>
              );
            })}
          </svg>

          {/* NODES */}
          {nodes.map(node => {
            const config = NODE_VARIANTS[node.type] || NODE_VARIANTS.webhook;
            const isSelected = selectedId === node.id;
            
            return (
              <div 
                key={node.id}
                onMouseDown={() => { setSelectedId(node.id); setDragNode(node.id); }}
                style={{ left: node.x, top: node.y }}
                className={`absolute w-60 bg-[#1a1c23] rounded-2xl border border-white/5 transition-all duration-200 group flex flex-col backdrop-blur-sm ${isSelected ? 'ring-2 ring-orange-500/50 shadow-[0_0_40px_rgba(249,115,22,0.1)] z-30 translate-y-[-2px]' : 'hover:border-white/20 hover:shadow-xl z-10'}`}
              >
                {/* Header Color Line */}
                <div className={`h-1.5 w-full rounded-t-2xl bg-gradient-to-r ${config.color} opacity-80`} />
                
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center text-white shadow-lg ${config.shadow}`}>
                      <config.icon size={18} />
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <span className="font-bold text-sm text-gray-200 truncate">{config.label}</span>
                      <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">{node.data.label}</span>
                    </div>
                  </div>
                  
                  {/* Mini Stats or Info */}
                  <div className="flex items-center gap-2 mt-2 pt-3 border-t border-white/5">
                    <span className="px-2 py-0.5 bg-white/5 rounded text-[10px] text-gray-400">v1.2</span>
                    <span className="px-2 py-0.5 bg-green-500/10 text-green-400 rounded text-[10px]">Success</span>
                  </div>
                </div>

                {/* Ports */}
                <div className="absolute -left-2 top-10 w-4 h-4 rounded-full bg-[#0f1117] border border-white/20 z-20 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-500" />
                </div>
                <div className="absolute -right-2 top-10 w-4 h-4 rounded-full bg-[#0f1117] border border-white/20 z-20 flex items-center justify-center group-hover:border-orange-500 cursor-crosshair">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-500 group-hover:bg-orange-500" />
                </div>
              </div>
            );
          })}
        </main>

        {/* PROPERTIES PANEL */}
        <aside className={`absolute right-0 top-16 bottom-0 w-80 bg-[#13151b]/95 backdrop-blur-xl border-l border-white/5 transform transition-transform duration-300 ${selectedId ? 'translate-x-0' : 'translate-x-full'}`}>
           <div className="h-full flex flex-col">
              <div className="p-5 border-b border-white/5 flex justify-between items-center">
                <span className="font-bold text-gray-200">Configuration</span>
                <button onClick={() => setSelectedId(null)} className="text-gray-500 hover:text-white"><X size={18}/></button>
              </div>
              <div className="p-5 space-y-6 overflow-y-auto flex-1">
                 {selectedId && (
                   <>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Label</label>
                        <input className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-orange-500 outline-none transition-colors" defaultValue="Mon Nœud" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Paramètres JSON</label>
                        <div className="bg-black/40 rounded-lg p-3 border border-white/5 font-mono text-xs text-green-400">
                          {`{\n  "mode": "auto",\n  "retry": 3\n}`}
                        </div>
                      </div>
                      <div className="pt-4 border-t border-white/5">
                        <button className="w-full py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm font-medium transition-colors border border-white/5">
                          Ouvrir l'éditeur avancé
                        </button>
                      </div>
                   </>
                 )}
              </div>
           </div>
        </aside>

      </div>
    </div>
  );
}

function MenuItem({ icon: Icon, label, active, isOpen }: any) {
  return (
    <button className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${active ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
      <Icon size={20} />
      {isOpen && <span className="text-sm font-medium">{label}</span>}
    </button>
  );
}
