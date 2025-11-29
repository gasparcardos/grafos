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
  
  history.push({
    active: null,
    visited: Array.from(visited),
    openList: [...queue],
    line: 1,
    description: `iniciando bfs cola inicializada con nodo ${start}`
  });

  while (queue.length > 0) {
    history.push({
      active: null,
      visited: Array.from(visited),
      openList: [...queue],
      line: 2,
      description: `verificando si la cola tiene elementos`
    });

    const current = queue.shift();
    
    history.push({
      active: current,
      visited: Array.from(visited),
      openList: [...queue],
      line: 3,
      description: `sacando nodo ${current} de la cola para procesar`
    });

    if (current === goal) {
      const finalPath = reconstructPath(parent, goal);
      history.push({
        active: current,
        visited: Array.from(visited),
        finalPath: finalPath,
        openList: [],
        line: 4,
        description: `objetivo ${goal} encontrado terminando busqueda`,
        success: true
      });
      return history;
    }

    history.push({
      active: current,
      visited: Array.from(visited),
      openList: [...queue],
      line: 5,
      description: `buscando vecinos de nodo ${current}`
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
          openList: [...queue],
          line: 7,
          description: `vecino ${neighbor.target} no visitado agregando a cola`
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
  
  history.push({
    active: null,
    visited: Array.from(visited),
    openList: [...stack],
    line: 1,
    description: `iniciando dfs pila inicializada con ${start}`
  });

  while (stack.length > 0) {
    history.push({
      active: null,
      visited: Array.from(visited),
      openList: [...stack],
      line: 2,
      description: `verificando pila no vacia`
    });

    const current = stack.pop();
    
    if (!visited.has(current)) {
      visited.add(current);
      
      history.push({
        active: current,
        visited: Array.from(visited),
        openList: [...stack],
        line: 3,
        description: `sacando nodo ${current} de la pila`
      });

      if (current === goal) {
        const finalPath = reconstructPath(parent, goal);
        history.push({
          active: current,
          visited: Array.from(visited),
          finalPath: finalPath,
          openList: [],
          line: 4,
          description: `objetivo encontrado ruta construida`,
          success: true
        });
        return history;
      }

      history.push({
        active: current,
        visited: Array.from(visited),
        openList: [...stack],
        line: 5,
        description: `analizando vecinos de ${current}`
      });

      const neighbors = adj.get(current) || [];
      for (let i = neighbors.length - 1; i >= 0; i--) {
        const neighbor = neighbors[i];
        if (!visited.has(neighbor.target)) {
          parent.set(neighbor.target, current);
          stack.push(neighbor.target);
          history.push({
            active: current,
            lookingAt: neighbor.target,
            visited: Array.from(visited),
            openList: [...stack],
            line: 7,
            description: `agregando vecino ${neighbor.target} a la pila`
          });
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

  history.push({
    active: start,
    visited: [],
    openList: JSON.parse(JSON.stringify(pq)),
    distances: { ...distances },
    line: 1,
    description: `inicializando distancias nodo ${start} a 0 resto infinito`
  });

  while (pq.length > 0) {
    history.push({
      active: null,
      visited: Array.from(visited),
      openList: JSON.parse(JSON.stringify(pq)),
      line: 2,
      description: `verificando cola de prioridad`
    });

    pq.sort((a, b) => a.dist - b.dist);
    const { id: current, dist: currentDist } = pq.shift();

    history.push({
      active: current,
      visited: Array.from(visited),
      openList: JSON.parse(JSON.stringify(pq)),
      distances: { ...distances },
      line: 3,
      description: `procesando nodo ${current} con distancia minima acumulada ${currentDist}`
    });

    if (visited.has(current)) continue;
    visited.add(current);

    if (current === goal) {
      const finalPath = reconstructPath(parent, goal);
      history.push({
        active: current,
        visited: Array.from(visited),
        finalPath: finalPath,
        distances: { ...distances },
        openList: [],
        line: 4,
        description: `llegamos al objetivo ${goal} con costo total ${currentDist}`,
        success: true
      });
      return history;
    }

    const neighbors = adj.get(current) || [];
    history.push({
      active: current,
      visited: Array.from(visited),
      openList: JSON.parse(JSON.stringify(pq)),
      line: 5,
      description: `revisando vecinos de ${current}`
    });

    for (let neighbor of neighbors) {
      if (!visited.has(neighbor.target)) {
        const newDist = currentDist + neighbor.weight;
        
        history.push({
          active: current,
          lookingAt: neighbor.target,
          visited: Array.from(visited),
          line: 6,
          description: `calculando nueva distancia para ${neighbor.target}: ${currentDist} + ${neighbor.weight} = ${newDist}`
        });

        if (newDist < distances[neighbor.target]) {
          distances[neighbor.target] = newDist;
          parent.set(neighbor.target, current);
          pq.push({ id: neighbor.target, dist: newDist });
          
          history.push({
            active: current,
            lookingAt: neighbor.target,
            visited: Array.from(visited),
            openList: JSON.parse(JSON.stringify(pq)),
            distances: { ...distances },
            line: 8,
            description: `actualizando distancia de ${neighbor.target} a ${newDist} es menor que la anterior`
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

  history.push({
    active: start,
    path: [...path],
    line: 1,
    description: `inicializando limite h(start) = ${threshold}`,
    threshold
  });

  const search = (node, g, bound) => {
    const f = g + h(node);
    
    history.push({
      active: node,
      path: [...path],
      openList: [`g=${g}`, `f=${f}`, `bound=${bound}`],
      line: 3,
      description: `explorando ${node} costo g=${g} total f=${f} limite=${bound}`,
      threshold: bound
    });

    if (f > bound) return f;
    
    if (node === goal) {
      history.push({
        active: node,
        path: [...path],
        line: 4,
        description: `objetivo encontrado dentro del limite`,
        success: true
      });
      return "FOUND";
    }
    
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
          line: 3,
          description: `backtracking regresando a ${node}`,
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
      line: 2,
      description: `iniciando nueva iteracion con limite ${threshold}`,
      threshold: threshold
    });

    const temp = search(start, 0, threshold);
    
    if (temp === "FOUND") {
      history.push({
        active: goal,
        path: [...path],
        finalPath: [...path],
        description: "busqueda terminada exitosamente",
        success: true
      });
      return history;
    }
    if (temp === Infinity) {
      history.push({ 
        description: "no existe camino posible",
        line: 5
      });
      return history;
    }
    
    history.push({
       active: start,
       description: `aumentando limite de ${threshold} a ${temp}`,
       line: 6
    });
    threshold = temp;
  }
};