export const generateGraph = (numNodes, density, type, isDirected = false) => {
  const nodes = [];
  const edges = [];
  for (let i = 0; i < numNodes; i++) {
    nodes.push({
      id: `${i}`,
      label: `N${i}`,
      fill: "#7A8F9E"
    });
  }
  const createEdge = (source, target) => {
    const weight = Math.floor(Math.random() * 10) + 1;
    return {
      id: `${source}-${target}`,
      source: `${source}`,
      target: `${target}`,
      weight: weight,
      label: `${weight}`,
      size: 1
    };
  };
  if (type === "complete") {
    for (let i = 0; i < numNodes; i++) {
      for (let j = i + 1; j < numNodes; j++) {
        edges.push(createEdge(i, j));
        if (isDirected) edges.push(createEdge(j, i));
      }
    }
  } else if (type === "random") {
    for (let i = 0; i < numNodes; i++) {
      for (let j = i + 1; j < numNodes; j++) {
        if (Math.random() < density) {
          edges.push(createEdge(i, j));
          if (isDirected && Math.random() < density) {
            edges.push(createEdge(j, i));
          }
        }
      }
    }
  } else if (type === "preferential") {
    if (numNodes > 1) {
      edges.push(createEdge(0, 1));
    }
    for (let i = 2; i < numNodes; i++) {
      let added = false;
      for (let j = 0; j < i; j++) {
        const degree = edges.filter(e => e.source === `${j}` || e.target === `${j}`).length;
        const prob = (degree + 1) / (edges.length + 1);
        if (Math.random() < prob || (!added && j === i - 1)) {
          edges.push(createEdge(i, j));
          added = true;
        }
      }
    }
  }
  return { nodes, edges };
};