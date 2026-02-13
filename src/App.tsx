import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, Plus, Search, Settings, X, 
  Zap, Globe, Mail, MessageSquare, Database, Clock, 
  Code, Cpu, Layers, Trash2, Share2, Loader2, CheckCircle2, AlertCircle
} from 'lucide-react';

// --- Configuration Backend ---
// Remplace par l'URL de ton serveur (ex: http://localhost:3000/api/workflow/execute)
const API_URL = "http://localhost:3000/api/workflow/execute";

const NODE_VARIANTS = {
  webhook: { label: 'Webhook', icon: Globe, color: 'from-pink-500 to-rose-500', shadow: 'shadow-pink-500/20' },
  gmail: { label: 'Gmail', icon: Mail, color: 'from-red-500 to-orange-500', shadow: 'shadow-red-500/20' },
  ai: { label: 'IA Agent', icon: Cpu, color: 'from-violet-500 to-purple-500', shadow: 'shadow-violet-500/20' },
  code: { label: 'JavaScript', icon: Code, color: 'from-yellow-400 to-orange-400', shadow: 'shadow-orange-500/20' },
  discord: { label: 'Discord', icon: MessageSquare, color: 'from-indigo-500 to-blue-500', shadow: 'shadow-indigo-500/20' },
  wait: { label: 'Timer', icon: Clock, color: 'from-emerald-400 to-teal-500', shadow: 'shadow-emerald-500/20' },
  db: { label: 'Postgres', icon: Database, color: 'from-blue-400 to-cyan-400', shadow: 'shadow-cyan-500/20' },
};

export default function App() {
  // --- ÉTAT ---
  const [nodes, setNodes] = useState([
    { id: '1', type: 'webhook', x: 100, y: 300, data: { label: 'Trigger Webhook' }, status: 'idle', result: null },
    { id: '2', type: 'ai', x: 450, y: 300, data: { label: 'Analyse IA' }, status: 'idle', result: null },
    { id: '3', type: 'discord', x: 800, y: 300, data: { label: 'Alerte Team' }, status: 'idle', result: null },
  ]);
  
  const [edges, setEdges] = useState([
    { id: 'e1', source: '1', target: '2' },
    { id: 'e2', source: '2', target: '3' },
  ]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [dragNode, setDragNode] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // --- LOGIQUE D'EXÉCUTION ---
  const runWorkflow = async () => {
    if (isExecuting) return;
    setIsExecuting(true);

    // Reset visuel avant lancement
    setNodes(nds => nds.map(n => ({ ...n, status: 'loading', result: null })));

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes, edges })
      });

      const data = await response.json();

      if (data.success) {
        setNodes(nds => nds.map(n => ({
          ...n,
          status: 'success',
          result: data.results?.[n.id]?.data || "Exécuté avec succès"
        })));
      } else {
        throw new Error(data.error || "Erreur serveur");
      }
    } catch (error) {
      console.error("Erreur:", error);
      setNodes(nds => nds.map(n => ({ ...n, status: 'error', result: "Erreur de connexion" })));
    } finally {
      setIsExecuting(false);
    }
  };

  // --- DRAG & DROP LOGIC ---
  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragNode && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - 120; // On centre sur le noeud
      const y = e.clientY - rect.top - 40;
      setNodes(nds => nds.map(n => n.id === dragNode ? { ...n, x, y } : n));
    }
  };

  return (
    <div className="flex h-screen w-screen bg-[#0f1117] text-white font-sans overflow-hidden selection:bg-orange-500/30">
      
      {/* --- SIDEBAR --- */}
      <aside className="w-64 bg-[#13151b] border-r border-white/5 flex flex-col z-20">
        <div className="h-16 flex items-center px-6 border-b border-white/5 gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Zap size={18} className="text-white" fill="currentColor"/>
          </div>
          <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">OpenFlow</span>
        </div>

        <div className="p-4 flex-1 space-y-6 overflow-y-auto">
          <div className="space-y-1">
            <MenuItem icon={Layers} label="Workflows" active />
            <MenuItem icon={Database} label="Credentials" />
            <MenuItem icon={Settings} label="Settings" />
          </div>

          <div className="pt-6 border-t border-white/5">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 italic">Bibliothèque</h3>
            <div className="grid grid-cols-1 gap-2">
              {Object.entries(NODE_VARIANTS).map(([key, val]) => (
                <button key={key} onClick={() => {
                  const id = Math.random().toString(36).substr(2, 9);
                  setNodes([...nodes, { id, type: key, x: 200, y: 200, data: { label: val.label }, status: 'idle', result: null }]);
                }} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/5 transition-all group text-left">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${val.color} flex items-center justify-center`}>
                    <val.icon size={14} className="text-white" />
                  </div>
                  <span className="text-sm text-gray-400 group-hover:text-white transition-colors">{val.label}</span>
                  <Plus size={14} className="ml-auto text-gray-600 group-hover:text-white" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <div className="flex-1 flex flex-col relative bg-[#0f1117]">
        
        {/* HEADER */}
        <header className="h-16 border-b border-white/5 bg-[#0f1117]/80 backdrop-blur-md flex items-center justify-between px-6 z-10 absolute top-0 w-full">
          <div className="flex items-center gap-4">
             <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <h1 className="font-semibold text-gray-200">Automatisation V2</h1>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase">Connecté</span>
                </div>
             </div>
          </div>
          <div className="flex items-center gap-3">
             <button 
                onClick={runWorkflow}
                disabled={isExecuting}
                className={`px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-lg ${isExecuting ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-white text-black hover:bg-gray-200 active:scale-95'}`}
             >
                {isExecuting ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} fill="currentColor"/>}
                {isExecuting ? 'Exécution...' : 'Lancer le Flow'}
             </button>
          </div>
        </header>

        {/* CANVAS AREA */}
        <main 
          ref={canvasRef}
          className="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing"
          onMouseMove={handleMouseMove}
          onMouseUp={() => setDragNode(null)}
          style={{ 
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)', 
            backgroundSize: '30px 30px'
          }}
        >
          {/* SVG CONNECTIONS */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
            {edges.map(edge => {
              const s = nodes.find(n => n.id === edge.source);
              const t = nodes.find(n => n.id === edge.target);
              if (!s || !t) return null;
              
              const sx = s.x + 240; // Sortie droite
              const sy = s.y + 45;
              const tx = t.x;       // Entrée gauche
              const ty = t.y + 45;
              
              return (
                <g key={edge.id}>
                  <path 
                    d={`M ${sx} ${sy} C ${sx + 80} ${sy}, ${tx - 80} ${ty}, ${tx} ${ty}`} 
                    stroke={isExecuting ? "#6366f1" : "rgba(255,255,255,0.1)"} 
                    strokeWidth="2" 
                    fill="none" 
                    className={isExecuting ? "animate-pulse" : ""}
                  />
                  {isExecuting && (
                    <circle r="3" fill="#818cf8">
                      <animateMotion 
                        dur="1.5s" 
                        repeatCount="indefinite" 
                        path={`M ${sx} ${sy} C ${sx + 80} ${sy}, ${tx - 80} ${ty}, ${tx} ${ty}`} 
                      />
                    </circle>
                  )}
                </g>
              );
            })}
          </svg>

          {/* NODES RENDERING */}
          {nodes.map(node => {
            const config = NODE_VARIANTS[node.type as keyof typeof NODE_VARIANTS] || NODE_VARIANTS.webhook;
            const isSelected = selectedId === node.id;
            
            return (
              <div 
                key={node.id}
                onMouseDown={(e) => { e.stopPropagation(); setSelectedId(node.id); setDragNode(node.id); }}
                style={{ left: node.x, top: node.y }}
                className={`absolute w-60 bg-[#1a1c23]/90 rounded-2xl border transition-all duration-200 backdrop-blur-md group flex flex-col ${isSelected ? 'border-orange-500 ring-4 ring-orange-500/10 z-30 shadow-2xl' : 'border-white/5 hover:border-white/20 z-10'}`}
              >
                <div className={`h-1.5 w-full rounded-t-2xl bg-gradient-to-r ${config.color}`} />
                
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center text-white shadow-lg`}>
                      <config.icon size={20} />
                    </div>
                    <div className="flex gap-1">
                      {node.status === 'loading' && <Loader2 size={16} className="text-blue-400 animate-spin" />}
                      {node.status === 'success' && <CheckCircle2 size={16} className="text-emerald-400" />}
                      {node.status === 'error' && <AlertCircle size={16} className="text-red-400" />}
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <span className="font-bold text-sm text-gray-200">{config.label}</span>
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">{node.data.label}</span>
                  </div>

                  {node.result && (
                    <div className="mt-3 p-2 bg-black/40 rounded-lg border border-white/5 text-[10px] font-mono text-emerald-400 max-h-24 overflow-auto scrollbar-hide">
                       {typeof node.result === 'string' ? node.result : JSON.stringify(node.result, null, 2)}
                    </div>
                  )}
                </div>

                {/* Ports de connexion visuels */}
                <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#0f1117] border border-white/10 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                </div>
                <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#0f1117] border border-white/10 flex items-center justify-center group-hover:border-orange-500 transition-colors">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-600 group-hover:bg-orange-500" />
                </div>
              </div>
            );
          })}
        </main>

        {/* PROPERTIES PANEL */}
        <aside className={`absolute right-0 top-16 bottom-0 w-80 bg-[#13151b]/95 backdrop-blur-xl border-l border-white/5 transform transition-transform duration-300 z-40 ${selectedId ? 'translate-x-0' : 'translate-x-full'}`}>
           <div className="h-full flex flex-col p-6">
              <div className="flex justify-between items-center mb-8">
                <h2 className="font-bold text-lg text-gray-200">Propriétés</h2>
                <button onClick={() => setSelectedId(null)} className="text-gray-500 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-all"><X size={20}/></button>
              </div>
              
              {selectedId && (
                <div className="space-y-6 flex-1 overflow-y-auto pr-2 scrollbar-thin">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nom du Noeud</label>
                    <input 
                      className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all"
                      value={nodes.find(n => n.id === selectedId)?.data.label}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNodes(nds => nds.map(n => n.id === selectedId ? { ...n, data: { ...n.data, label: val } } : n));
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Configuration JSON</label>
                    <div className="bg-black/40 rounded-xl p-4 border border-white/10 font-mono text-xs text-blue-300 leading-relaxed">
                      {`{\n  "id": "${selectedId}",\n  "type": "${nodes.find(n => n.id === selectedId)?.type}",\n  "retry": true,\n  "timeout": 5000\n}`}
                    </div>
                  </div>

                  <div className="pt-6 mt-6 border-t border-white/5">
                    <button 
                      onClick={() => {
                        setNodes(nds => nds.filter(n => n.id !== selectedId));
                        setEdges(edgs => edgs.filter(e => e.source !== selectedId && e.target !== selectedId));
                        setSelectedId(null);
                      }}
                      className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl text-xs font-bold transition-all border border-red-500/20 flex items-center justify-center gap-2 group"
                    >
                      <Trash2 size={16} className="group-hover:rotate-12 transition-transform" /> Supprimer ce noeud
                    </button>
                  </div>
                </div>
              )}
           </div>
        </aside>
      </div>
    </div>
  );
}

// --- SOUS-COMPOSANT MENU ---
function MenuItem({ icon: Icon, label, active }: { icon: any, label: string, active?: boolean }) {
  return (
    <button className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all group ${active ? 'bg-white/10 text-white shadow-inner' : 'text-gray-500 hover:text-gray-200 hover:bg-white/5'}`}>
      <Icon size={18} className={`${active ? 'text-orange-500' : 'text-gray-500 group-hover:text-gray-300'} transition-colors`} />
      <span className="text-sm font-semibold">{label}</span>
    </button>
  );
}
