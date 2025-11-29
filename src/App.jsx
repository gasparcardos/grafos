import React, { useState, useEffect, useRef } from 'react';
import { GraphCanvas } from 'reagraph';
import { generateGraph } from './GraphGenerator';
import { runAlgorithm } from './Algorithms';
import { calculateMetrics } from './Metrics';
import { pseudocodeData } from './PseudocodeData';
import './App.css';

function App() {
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
  const [metrics, setMetrics] = useState(null);
  const [config, setConfig] = useState({ numNodes: 6, density: 0.3, type: 'random' });
  const [history, setHistory] = useState([]);
  const [stepIndex, setStepIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(500);
  const [algo, setAlgo] = useState('BFS');
  const [startNode, setStartNode] = useState('0');
  const [endNode, setEndNode] = useState('1');
  const [hoveredNode, setHoveredNode] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => { handleGenerate(); }, []);

  useEffect(() => {
    if (graphData.nodes.length > 0) {
      setMetrics(calculateMetrics(graphData.nodes, graphData.edges, false));
    }
  }, [graphData]);

  useEffect(() => {
    if (isPlaying && history.length > 0) {
      timerRef.current = setInterval(() => {
        setStepIndex(prev => {
          if (prev >= history.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, speed);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isPlaying, history, speed]);

  const handleGenerate = () => {
    setIsPlaying(false);
    setStepIndex(-1);
    setHistory([]);
    const data = generateGraph(parseInt(config.numNodes), parseFloat(config.density), config.type);
    setGraphData(data);
    if (!data.nodes.find(n => n.id === startNode)) setStartNode('0');
    const lastNodeId = `${data.nodes.length - 1}`;
    if (!data.nodes.find(n => n.id === endNode)) setEndNode(lastNodeId);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        if (json.nodes && json.edges) {
          setGraphData(json);
          setIsPlaying(false);
          setStepIndex(-1);
        } else { alert("json invalido"); }
      } catch (err) { alert("error al leer archivo"); }
    };
    reader.readAsText(file);
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(graphData));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "grafo_exportado.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  // --- NUEVA FUNCIÓN AGREGADA: EXPORTAR LOGS A TXT ---
  const handleExportLogs = () => {
    if (history.length === 0) {
      alert("No hay pasos para exportar. Ejecuta un algoritmo primero.");
      return;
    }

    const logContent = history.map((step, index) => {
      return `Paso ${index + 1}: ${step.description}`;
    }).join('\n');

    // Usamos graphData.nodes.length para el reporte real
    const fileContent = `REPORTE DE EJECUCIÓN - ${algo}\n` +
                        `Fecha: ${new Date().toLocaleString()}\n` +
                        `Nodos: ${graphData.nodes.length} | Aristas: ${graphData.edges.length}\n` +
                        `Inicio: ${startNode} -> Fin: ${endNode}\n` +
                        `--------------------------------------------------\n\n` +
                        logContent;

    const blob = new Blob([fileContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reporte_${algo}_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  // ---------------------------------------------------

  const handleRunAlgorithm = () => {
    const startExists = graphData.nodes.find(n => n.id === startNode);
    const endExists = graphData.nodes.find(n => n.id === endNode);
    if (!startExists || !endExists) {
      alert("nodos inicio o fin no existen");
      return;
    }
    const steps = runAlgorithm(algo, graphData, startNode, endNode);
    if (steps.length === 0) { alert("sin pasos generados"); return; }
    setHistory(steps);
    setStepIndex(0);
    setIsPlaying(true);
  };

  const getVisualGraph = () => {
    const colors = {
      default: '#95A5A6', active: '#E74C3C', visited: '#2ECC71',
      path: '#3498DB', target: '#9B59B6', looking: '#F1C40F',
      finalPath: '#F1C40F', // DORADO
      edgeDefault: '#BDC3C7', edgeActive: '#E74C3C'
    };
    
    if (stepIndex === -1 || !history[stepIndex]) return graphData;
    const currentStep = history[stepIndex];

    // 1. Crear un Set de las conexiones de la ruta final para búsqueda rápida
    const finalPathEdges = new Set();
    if (currentStep.finalPath) {
        for (let i = 0; i < currentStep.finalPath.length - 1; i++) {
            const u = String(currentStep.finalPath[i]);
            const v = String(currentStep.finalPath[i + 1]);
            // Guardamos ambas direcciones "A-B" y "B-A" para evitar errores de dirección
            finalPathEdges.add(`${u}->${v}`);
            finalPathEdges.add(`${v}->${u}`);
        }
    }

    // 2. Procesar Nodos (Igual que antes)
    const newNodes = graphData.nodes.map(node => {
      let color = colors.default;
      let label = node.id;
      const nodeIdStr = String(node.id); // Convertir a string para comparar seguro
      
      if (algo === 'Dijkstra' && currentStep.distances && currentStep.distances[node.id] !== Infinity) {
        label = `${node.id} (d:${currentStep.distances[node.id]})`;
      }

      if (algo === 'IDA*') {
        if (currentStep.path && currentStep.path.map(String).includes(nodeIdStr)) color = colors.path;
        if (String(currentStep.active) === nodeIdStr) color = colors.active;
      } else {
        if (currentStep.visited && currentStep.visited.map(String).includes(nodeIdStr)) color = colors.visited;
        if (String(currentStep.active) === nodeIdStr) color = colors.active;
        if (String(currentStep.lookingAt) === nodeIdStr) color = colors.looking;
      }
      
      if (currentStep.finalPath && currentStep.finalPath.map(String).includes(nodeIdStr)) color = colors.finalPath;
      
      if (nodeIdStr === String(endNode) && !currentStep.finalPath) {
        if (String(currentStep.active) !== nodeIdStr && color === colors.default) color = colors.target;
      }
      return { ...node, fill: color, label: label };
    });

    // 3. Procesar Aristas (Lógica REFORZADA)
    const newEdges = graphData.edges.map(edge => {
      let size = edge.weight ? Math.max(1, edge.weight / 2) : 1;
      let color = colors.edgeDefault;
      const u = String(edge.source);
      const v = String(edge.target);
      const edgeKey = `${u}->${v}`;
      
      // A. Verificar Ruta Final
      if (finalPathEdges.has(edgeKey)) {
        color = colors.finalPath; // Dorado #F1C40F
        size = 5; // Grosor forzado
      } 
      // B. Verificar Exploración Activa (Si no es ruta final)
      else if (currentStep.active && currentStep.lookingAt) {
          const active = String(currentStep.active);
          const looking = String(currentStep.lookingAt);
          // Si la arista conecta el nodo activo con el vecino que estamos mirando
          if ((u === active && v === looking) || (u === looking && v === active)) {
            color = colors.edgeActive;
            size = 3;
          }
      }
      
      return { 
        ...edge, 
        size: size, 
        color: color, 
        // Importante: reagraph a veces necesita 'fill' en lugar de 'color' dependiendo de la versión
        fill: color, 
        label: edge.weight ? `${edge.weight}` : '' 
      };
    });
    
    return { nodes: newNodes, edges: newEdges };
  };

  const visualData = getVisualGraph();
  const currentLine = stepIndex >= 0 && history[stepIndex] ? history[stepIndex].line : -1;
  const currentOpenList = stepIndex >= 0 && history[stepIndex] ? history[stepIndex].openList : [];
  const currentActive = stepIndex >= 0 && history[stepIndex] ? history[stepIndex].active : null;
  const currentDist = (stepIndex >= 0 && history[stepIndex]?.distances && hoveredNode) 
    ? history[stepIndex].distances[hoveredNode] : 'inf';

  return (
    <div className="app-layout">
      <div className="sidebar-left">
        <h3>Panel de Control</h3>
        <div className="control-item">
          <label>Nodos</label>
          <input type="number" value={config.numNodes} onChange={e => setConfig({ ...config, numNodes: e.target.value })} />
        </div>
        <div className="control-item">
          <label>Tipo</label>
          <select value={config.type} onChange={e => setConfig({ ...config, type: e.target.value })}>
            <option value="random">Aleatorio</option>
            <option value="preferential">Mundo pequeño</option>
            <option value="complete">Completo</option>
          </select>
        </div>
        <button className="btn btn-primary" style={{marginTop: 10}} onClick={handleGenerate}>Generar</button>
        <button className="btn btn-export" onClick={handleExport}>Exportar json</button>
        {metrics && (
          <div className="metrics-box" style={{marginTop: 10}}>
            <div>Nodos: {metrics.countN} | Aristas: {metrics.countE}</div>
            <div>Densidad: {metrics.density}</div>
          </div>
        )}
        <div className="control-item" style={{marginTop: 10}}>
          <label>Cargar json</label>
          <input type="file" accept=".json" onChange={handleFileUpload} />
        </div>
        <hr style={{ border: 0, borderTop: '1px solid #eee', width: '100%', margin: '15px 0' }} />
        <div className="control-item">
          <label>Algoritmo</label>
          <select value={algo} onChange={e => setAlgo(e.target.value)}>
            <option value="BFS">BFS Anchura</option>
            <option value="DFS">DFS Profundidad</option>
            <option value="Dijkstra">Dijkstra Costo</option>
            <option value="IDA*">IDA* Iterativo</option>
          </select>
        </div>
        <div className="control-item">
          <label>Inicio</label>
          <input type="text" value={startNode} onChange={e => setStartNode(e.target.value)} />
        </div>
        <div className="control-item">
          <label>Fin</label>
          <input type="text" value={endNode} onChange={e => setEndNode(e.target.value)} />
        </div>
        <div className="control-group" style={{marginTop: 10}}>
          <button className="btn btn-action" onClick={handleRunAlgorithm} disabled={isPlaying}>Ejecutar</button>
          <button className="btn btn-secondary" onClick={() => setIsPlaying(!isPlaying)}>{isPlaying ? 'Pausa' : 'Play'}</button>
        </div>
        <div className="control-item">
          <label>Velocidad {speed}ms</label>
          <input type="range" min="100" max="2000" step="100" value={speed} onChange={e => setSpeed(Number(e.target.value))} />
        </div>
        
        {/* BOTÓN AGREGADO: DESCARGAR REPORTE */}
        <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
             <button 
                className="btn btn-secondary" 
                style={{ fontSize: '0.7rem', padding: '4px 8px' }}
                onClick={handleExportLogs}
                disabled={history.length === 0}
             >
                📄 Descargar reporte
             </button>
        </div>

        <div className="log-box" style={{marginTop: 5}}>
          {stepIndex >= 0 && history[stepIndex]
            ? history[stepIndex].description
            : "Listo para iniciar"}
        </div>
      </div>

      <div className="canvas-container">
        {/* LEYENDA DE COLORES AGREGADA */}
        <div style={{
            position: 'absolute', bottom: 10, left: 10, 
            background: 'rgba(255,255,255,0.9)', padding: '10px', 
            borderRadius: '8px', fontSize: '0.7rem', pointerEvents: 'none',
            zIndex: 100, border: '1px solid #ddd', boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
        }}>
            <div style={{marginBottom: 3, fontWeight: 'bold'}}>Estados:</div>
            <div style={{display:'flex', alignItems:'center', gap:5, marginBottom:2}}><span style={{width:10, height:10, background:'#E74C3C', borderRadius:'50%'}}></span> Activo</div>
            <div style={{display:'flex', alignItems:'center', gap:5, marginBottom:2}}><span style={{width:10, height:10, background:'#2ECC71', borderRadius:'50%'}}></span> Visitado</div>
            <div style={{display:'flex', alignItems:'center', gap:5, marginBottom:2}}><span style={{width:10, height:10, background:'#F1C40F', borderRadius:'50%'}}></span> Frontera</div>
            <div style={{display:'flex', alignItems:'center', gap:5}}><span style={{width:20, height:3, background:'#F1C40F'}}></span> Ruta Final</div>
        </div>

        {hoveredNode && (
          <div className="tooltip-card">
            <div><strong>ID:</strong> {hoveredNode}</div>
            <div><strong>estado:</strong> {currentActive === hoveredNode ? 'activo' : 'inactivo'}</div>
            {algo === 'Dijkstra' && <div><strong>Distancia:</strong> {currentDist}</div>}
          </div>
        )}
        <GraphCanvas
          nodes={visualData.nodes}
          edges={visualData.edges}
          labelType="all"
          layoutType="forceDirected2d"
          edgeLabelPosition="natural"
          edgeArrowPosition="end"
          draggable={true}
          onNodePointerOver={(n) => setHoveredNode(n.id)}
          onNodePointerOut={() => setHoveredNode(null)}
        />
      </div>

      <div className="sidebar-right">
        <h3>Pseudocodigo</h3>
        <div className="code-panel">
          {pseudocodeData[algo].map((step, idx) => (
            <div key={idx} className={`code-line ${currentLine === step.line ? 'highlight' : ''}`}>
              {step.line}. {step.text}
            </div>
          ))}
        </div>
        <h3>Frontera / Cola</h3>
        <div className="queue-panel">
          {currentOpenList && currentOpenList.length > 0 ? (
            currentOpenList.map((item, i) => (
              <div key={i} className="queue-item">
                {algo === 'Dijkstra' ? `nodo ${item.id} (d:${item.dist})` : (typeof item === 'object' ? item.id : item)}
              </div>
            ))
          ) : <div style={{fontSize: '0.7rem', color: '#999'}}>Vacia</div>}
        </div>
      </div>
    </div>
  );
}

export default App;