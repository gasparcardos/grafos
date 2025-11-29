export const pseudocodeData = {
  BFS: [
    { line: 1, text: "cola = [inicio], visitados = {inicio}" },
    { line: 2, text: "mientras cola no este vacia:" },
    { line: 3, text: "  actual = sacar de cola" },
    { line: 4, text: "  si actual == destino: terminar" },
    { line: 5, text: "  para cada vecino de actual:" },
    { line: 6, text: "    si vecino no visitado:" },
    { line: 7, text: "      agregar a cola y visitados" }
  ],
  DFS: [
    { line: 1, text: "pila = [inicio], visitados = {inicio}" },
    { line: 2, text: "mientras pila no este vacia:" },
    { line: 3, text: "  actual = sacar de pila" },
    { line: 4, text: "  si actual == destino: terminar" },
    { line: 5, text: "  para cada vecino (orden inverso):" },
    { line: 6, text: "    si vecino no visitado:" },
    { line: 7, text: "      agregar a pila y visitados" }
  ],
  Dijkstra: [
    { line: 1, text: "distancias[inicio]=0, cola_prioridad=[(0, inicio)]" },
    { line: 2, text: "mientras cola no este vacia:" },
    { line: 3, text: "  actual = extraer minimo de cola" },
    { line: 4, text: "  si actual == destino: terminar" },
    { line: 5, text: "  para cada vecino de actual:" },
    { line: 6, text: "    nueva_dist = dist[actual] + peso" },
    { line: 7, text: "    si nueva_dist < dist[vecino]:" },
    { line: 8, text: "      actualizar dist y agregar a cola" }
  ],
  "IDA*": [
    { line: 1, text: "limite = h(inicio)" },
    { line: 2, text: "mientras no encontrado:" },
    { line: 3, text: "  temp = buscar(inicio, 0, limite)" },
    { line: 4, text: "  si temp == encontrado: terminar" },
    { line: 5, text: "  si temp == infinito: no existe camino" },
    { line: 6, text: "  limite = temp" }
  ]
};