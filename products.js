// Catálogo de productos. "boxUnits" = cantidad de unidades que trae cada caja.
// "cold" = necesita nevera. "shape/c1/c2" = aspecto del icono pixel art.
export const PRODUCTS = [
  { id: 'milk',    name: 'Leche entera',     category: 'Lácteos',   buy: 0.70, sell: 1.15, boxUnits: 12, cold: true,  shape: 'carton', c1: '#f4f4ee', c2: '#3b78c4' },
  { id: 'yogurt',  name: 'Yogur natural',    category: 'Lácteos',   buy: 0.35, sell: 0.69, boxUnits: 12, cold: true,  shape: 'cup',    c1: '#f2f2f2', c2: '#e0527a' },
  { id: 'cola',    name: 'Refresco de cola', category: 'Bebidas',   buy: 0.55, sell: 1.20, boxUnits: 12, cold: true,  shape: 'can',    c1: '#b3202a', c2: '#f1f1f1' },
  { id: 'juice',   name: 'Zumo de naranja',  category: 'Bebidas',   buy: 0.90, sell: 1.69, boxUnits: 8,  cold: true,  shape: 'bottle', c1: '#f08a24', c2: '#4caa3f' },
  { id: 'bread',   name: 'Pan de molde',     category: 'Panadería', buy: 0.80, sell: 1.49, boxUnits: 8,  cold: false, shape: 'bag',    c1: '#d9a066', c2: '#8b5a2b' },
  { id: 'cereal',  name: 'Cereales',         category: 'Desayuno',  buy: 1.50, sell: 2.89, boxUnits: 10, cold: false, shape: 'box',    c1: '#e9c23a', c2: '#c0392b' },
  { id: 'pasta',   name: 'Pasta',            category: 'Despensa',  buy: 0.60, sell: 1.25, boxUnits: 12, cold: false, shape: 'bag',    c1: '#f2d98a', c2: '#3d8c40' },
  { id: 'cookies', name: 'Galletas',         category: 'Snacks',    buy: 0.95, sell: 1.79, boxUnits: 12, cold: false, shape: 'box',    c1: '#8a5a3c', c2: '#e8d6b0' },
  { id: 'chips',   name: 'Patatas fritas',   category: 'Snacks',    buy: 0.85, sell: 1.65, boxUnits: 10, cold: false, shape: 'bag',    c1: '#e6b422', c2: '#d0342c' },
  { id: 'tp',      name: 'Papel higiénico',  category: 'Hogar',     buy: 1.80, sell: 3.49, boxUnits: 12, cold: false, shape: 'roll',   c1: '#f0f0f0', c2: '#5aa9e6' },
];

export const PRODUCT_BY_ID = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));

export function formatMoney(n) {
  return n.toFixed(2).replace('.', ',') + ' €';
}
