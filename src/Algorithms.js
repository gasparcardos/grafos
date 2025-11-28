const reconstructPath = (parentMap, endNode) => {
  const path = [endNode];
  let curr = endNode;
  while (parentMap.has(curr)) {
    curr = parentMap.get(curr);
    path.unshift(curr);
  }
  return path;
};

export const runAlgorithm = (algorithmName, graph, startNodeId, endNodeId) => {
  const { nodes, edges } = graph;
  const adjList = new Map();
  nodes.forEach(n => adjList.set(n.id, []));
  edges.forEach(e => {
    const w = (e.weight !== undefined && e.weight !== null) ? Number(e.weight) : 1;
    adjList.get(e.source).push({ target: e.target, weight: w });
    const reverseExists = edges.find(ed => ed.source === e.target && ed.target === e.source);
    if (!reverseExists) {
      adjList.get(e.target).push({ target: e.source, weight: w });
    }
  });

  if (algorithmName === 'BFS') return bfs(adjList, startNodeId, endNodeId);
  if (algorithmName === 'DFS') return dfs(adjList, startNodeId, endNodeId);
  if (algorithmName === 'Dijkstra') return dijkstra(adjList, startNodeId, endNodeId);
  if (algorithmName === 'IDA*') return idaStar(adjList, startNodeId, endNodeId);
  return [];
};

const bfs = (adj, start, goal) => {
  const history = [];
  const queue = [start];
  const visited = new Set();
  const parent = new Map();
  visited.add(start);
  while (queue.length > 0) {
    const current = queue.shift();
    if (current === goal) {
      const finalPath = reconstructPath(parent, goal);
      history.push({
        active: current,
        visited: Array.from(visited),
        finalPath: finalPath,
        description: `objetivo encontrado ruta ${finalPath.join(' -> ')}`,
        success: true
      });
      return history;
    }
    history.push({
      active: current,
      visited: Array.from(visited),
      description: `visitando nodo ${current}`
    });
    const neighbors = adj.get(current) || [];
    for (let neighbor of neighbors) {
      if (!visited.has(neighbor.target)) {
        visited.add(neighbor.target);
        parent.set(neighbor.target, current);
        queue.push(neighbor.target);
        history.push({
          active: current,
          visited: Array.from(visited),
          lookingAt: neighbor.target,
          description: `encontrado vecino ${neighbor.target}`
        });
      }
    }
  }
  return history;
};

const dfs = (adj, start, goal) => {
  const history = [];
  const stack = [start];
  const visited = new Set();
  const parent = new Map();
  while (stack.length > 0) {
    const current = stack.pop();
    if (!visited.has(current)) {
      visited.add(current);
      if (current === goal) {
        const finalPath = reconstructPath(parent, goal);
        history.push({
          active: current,
          visited: Array.from(visited),
          finalPath: finalPath,
          description: `objetivo encontrado dfs`,
          success: true
        });
        return history;
      }
      history.push({
        active: current,
        visited: Array.from(visited),
        description: `explorando nodo ${current}`
      });
      const neighbors = adj.get(current) || [];
      for (let i = neighbors.length - 1; i >= 0; i--) {
        const neighbor = neighbors[i];
        if (!visited.has(neighbor.target)) {
          parent.set(neighbor.target, current);
          stack.push(neighbor.target);
        }
      }
    }
  }
  return history;
};

const dijkstra = (adj, start, goal) => {
  const history = [];
  const distances = {};
  const visited = new Set();
  const parent = new Map();
  const pq = [{ id: start, dist: 0 }];
  adj.forEach((_, key) => distances[key] = Infinity);
  distances[start] = 0;
  while (pq.length > 0) {
    pq.sort((a, b) => a.dist - b.dist);
    const { id: current, dist: currentDist } = pq.shift();
    if (visited.has(current)) continue;
    visited.add(current);
    history.push({
      active: current,
      visited: Array.from(visited),
      distances: { ...distances },
      description: `procesando ${current} dist acumulada ${currentDist}`
    });
    if (current === goal) {
      const finalPath = reconstructPath(parent, goal);
      history.push({
        active: current,
        visited: Array.from(visited),
        finalPath: finalPath,
        description: `objetivo alcanzado costo total ${currentDist}`,
        success: true
      });
      return history;
    }
    const neighbors = adj.get(current) || [];
    for (let neighbor of neighbors) {
      if (!visited.has(neighbor.target)) {
        const newDist = currentDist + neighbor.weight;
        if (newDist < distances[neighbor.target]) {
          distances[neighbor.target] = newDist;
          parent.set(neighbor.target, current);
          pq.push({ id: neighbor.target, dist: newDist });
          history.push({
            active: current,
            lookingAt: neighbor.target,
            visited: Array.from(visited),
            distances: { ...distances },
            description: `actualizando ${neighbor.target} a dist ${newDist}`
          });
        }
      }
    }
  }
  return history;
};

const idaStar = (adj, start, goal) => {
  const history = [];
  const h = (n) => 0;
  let threshold = h(start);
  const path = [start];
  const visitedInPath = new Set([start]);
  const search = (node, g, bound) => {
    const f = g + h(node);
    history.push({
      active: node,
      path: [...path],
      description: `umbral ${bound} visitando ${node} f ${f}`,
      threshold: bound
    });
    if (f > bound) return f;
    if (node === goal) return "FOUND";
    let min = Infinity;
    const neighbors = adj.get(node) || [];
    neighbors.sort((a, b) => a.weight - b.weight);
    for (let neighbor of neighbors) {
      if (!visitedInPath.has(neighbor.target)) {
        path.push(neighbor.target);
        visitedInPath.add(neighbor.target);
        const t = search(neighbor.target, g + neighbor.weight, bound);
        if (t === "FOUND") return "FOUND";
        if (t < min) min = t;
        path.pop();
        visitedInPath.delete(neighbor.target);
        history.push({
          active: node,
          path: [...path],
          description: `regresando a ${node}`,
          threshold: bound
        });
      }
    }
    return min;
  };
  while (true) {
    history.push({
      active: start,
      path: [],
      description: `nuevo limite threshold ${threshold}`,
      threshold: threshold
    });
    const temp = search(start, 0, threshold);
    if (temp === "FOUND") {
      history.push({
        active: goal,
        path: [...path],
        finalPath: [...path],
        description: "objetivo encontrado",
        success: true
      });
      return history;
    }
    if (temp === Infinity) {
      history.push({ description: "no existe camino al objetivo" });
      return history;
    }
    threshold = temp;
  }
};