export const calculateMetrics = (nodes, edges, isDirected = false) => {
  const numNodes = nodes.length;
  const numEdges = edges.length;
  if (numNodes === 0) return null;
  const possibleEdges = numNodes * (numNodes - 1);
  let density = 0;
  if (possibleEdges > 0) {
    density = isDirected ? numEdges / possibleEdges : (2 * numEdges) / possibleEdges;
  }
  const avgDegree = (2 * numEdges) / numNodes;
  return {
    countN: numNodes,
    countE: numEdges,
    density: density.toFixed(4),
    avgDegree: avgDegree.toFixed(2),
    isDirected: isDirected ? "si" : "no"
  };
};