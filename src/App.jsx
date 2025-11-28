import React, { useState, useEffect, useRef } from 'react';
import { GraphCanvas } from 'reagraph';
import { generateGraph } from './GraphGenerator';
import { runAlgorithm } from './Algorithms';
import { calculateMetrics } from './Metrics';
import './App.css';

function App() {
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
  const [metrics, setMetrics] = useState(null);
  const [config, setConfig] = useState({ numNodes: 6, density: 0.3, type: 'random' });
  const [history, setHistory] = useState([]);
  const [stepIndex, setStepIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(800);
  const [algo, setAlgo] = useState('BFS');
  const [startNode, setStartNode] = useState('0');
  const [endNode, setEndNode] = useState('1');
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
      default: '#95A5A6',
      active: '#E74C3C',
      visited: '#2ECC71',
      path: '#3498DB',
      target: '#9B59B6',
      looking: '#F1C40F',
      finalPath: '#F1C40F',
      edgeDefault: '#D3D3D3',
      edgeActive: '#E74C3C'
    };

    if (stepIndex === -1 || !history[stepIndex]) return graphData;
    const currentStep = history[stepIndex];

    const newNodes = graphData.nodes.map(node => {
      let color = colors.default;
      if (algo === 'IDA*') {
        if (currentStep.path && currentStep.path.includes(node.id)) color = colors.path;
        if (currentStep.active === node.id) color = colors.active;
      } else {
        if (currentStep.visited && currentStep.visited.includes(node.id)) color = colors.visited;
        if (currentStep.active === node.id) color = colors.active;
        if (currentStep.lookingAt === node.id) color = colors.looking;
      }
      if (currentStep.finalPath && currentStep.finalPath.includes(node.id)) {
        color = colors.finalPath;
      }
      if (node.id === endNode && !currentStep.finalPath) {
        if (currentStep.active !== node.id && color === colors.default) color = colors.target;
      }
      return { ...node, fill: color };
    });

    const newEdges = graphData.edges.map(edge => {
      let size = 1;
      let color = colors.edgeDefault;
      
      if (currentStep.finalPath) {
        for (let i = 0; i < currentStep.finalPath.length - 1; i++) {
          const u = currentStep.finalPath[i];
          const v = currentStep.finalPath[i + 1];
          if ((edge.source === u && edge.target === v) || (edge.source === v && edge.target === u)) {
            color = colors.finalPath;
            size = 3;
            break;
          }
        }
      } else {
        if (currentStep.active && currentStep.lookingAt) {
          if ((edge.source === currentStep.active && edge.target === currentStep.lookingAt) ||
              (edge.source === currentStep.lookingAt && edge.target === currentStep.active)) {
            color = colors.edgeActive;
            size = 3;
          }
        }
      }

      return { ...edge, size, color: color }; // reagraph leera la propiedad color directamente
    });

    return { nodes: newNodes, edges: newEdges };
  };

  const visualData = getVisualGraph();

  return (
    <div className="app-container">
      <div className="sidebar">
        <h3>graph explorer</h3>
        <div className="control-group">
          <div className="control-item">
            <label>nodos</label>
            <input type="number" value={config.numNodes} onChange={e => setConfig({ ...config, numNodes: e.target.value })} />
          </div>
          <div className="control-item" style={{ flex: 2 }}>
            <label>tipo</label>
            <select value={config.type} onChange={e => setConfig({ ...config, type: e.target.value })}>
              <option value="random">aleatorio</option>
              <option value="preferential">mundo pequeño</option>
              <option value="complete">completo</option>
            </select>
          </div>
        </div>
        <button className="btn btn-primary" onClick={handleGenerate}>generar nuevo</button>
        {metrics && (
          <div className="metrics-box">
            <div className="metrics-row">
              <span>nodos {metrics.countN}</span>
              <span>aristas {metrics.countE}</span>
            </div>
            <div style={{ fontSize: '0.85em' }}>densidad {metrics.density}</div>
            <div style={{ fontSize: '0.85em' }}>grado prom {metrics.avgDegree}</div>
          </div>
        )}
        <div className="control-item">
          <label>subir json</label>
          <input type="file" accept=".json" onChange={handleFileUpload} style={{ padding: '5px' }} />
        </div>
        <hr style={{ margin: '5px 0', border: '0', borderTop: '1px solid #eee' }} />
        <div className="control-item">
          <label>algoritmo</label>
          <select value={algo} onChange={e => setAlgo(e.target.value)}>
            <option value="BFS">bfs anchura</option>
            <option value="DFS">dfs profundidad</option>
            <option value="IDA*">ida iterativo</option>
            <option value="Dijkstra">dijkstra costo</option>
          </select>
        </div>
        <div className="control-group">
          <div className="control-item">
            <label>inicio</label>
            <input type="text" value={startNode} onChange={e => setStartNode(e.target.value)} />
          </div>
          <div className="control-item">
            <label>fin</label>
            <input type="text" value={endNode} onChange={e => setEndNode(e.target.value)} />
          </div>
        </div>
        <div className="control-group">
          <button className="btn btn-action" style={{ flex: 1 }} onClick={handleRunAlgorithm} disabled={isPlaying}>
            ejecutar
          </button>
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsPlaying(!isPlaying)}>
            {isPlaying ? 'pausa' : 'play'}
          </button>
        </div>
        <div className="control-item">
          <label>velocidad {speed}ms</label>
          <input type="range" min="100" max="2000" step="100" value={speed} onChange={e => setSpeed(Number(e.target.value))} />
        </div>
        <div className="log-box">
          {stepIndex >= 0 && history[stepIndex]
            ? <span style={{ color: history[stepIndex].success ? '#d4ac0d' : '#333', fontWeight: history[stepIndex].success ? 'bold' : 'normal' }}>
              <strong>{stepIndex + 1} </strong> {history[stepIndex].description}
            </span>
            : <em>selecciona algoritmo y ejecuta</em>}
        </div>
      </div>
      <GraphCanvas
        nodes={visualData.nodes}
        edges={visualData.edges}
        labelType="all"
        layoutType="forceDirected2d"
        edgeLabelPosition="natural"
        edgeArrowPosition="none"
        draggable={true}
        focusOnSelect={true}
      />
    </div>
  );
}

export default App;