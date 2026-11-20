// BFS sobre rejilla de tiles (4 direcciones). Suficiente para un mapa de 40x30.
export function findPath(blocked, w, h, from, to) {
  const inside = (x, y) => x >= 0 && y >= 0 && x < w && y < h;
  if (!inside(from.x, from.y) || !inside(to.x, to.y)) return null;
  if (from.x === to.x && from.y === to.y) return [];
  const key = (x, y) => y * w + x;
  const prev = new Map([[key(from.x, from.y), -1]]);
  const queue = [from];
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  for (let i = 0; i < queue.length; i++) {
    const c = queue[i];
    for (const [dx, dy] of dirs) {
      const nx = c.x + dx, ny = c.y + dy;
      if (!inside(nx, ny)) continue;
      const k = key(nx, ny);
      if (prev.has(k)) continue;
      const isGoal = nx === to.x && ny === to.y;
      if (blocked[ny][nx] && !isGoal) continue;
      prev.set(k, key(c.x, c.y));
      if (isGoal) {
        const path = [];
        let cur = k;
        while (cur !== -1) {
          path.push({ x: cur % w, y: Math.floor(cur / w) });
          cur = prev.get(cur);
        }
        path.reverse();
        path.shift(); // sin la casilla de origen
        return path;
      }
      queue.push({ x: nx, y: ny });
    }
  }
  return null;
}
