/* MIRA category glyphs: 18 distinct, consistent line icons across Home, Interests and Categories. */
(()=>{
const shapes={
  "clothing": "<path d=\"m8 4-4 3 2 4 2-1v10h8V10l2 1 2-4-4-3-2 2h-4z\"/><path d=\"M10 6h4\"/>",
  "shoes": "<path d=\"M3 16c5 0 7-2 8-6l2 2c2 2 5 3 8 3v4H3z\"/><path d=\"m13 13 2-1M16 15l2-1\"/>",
  "perfumes": "<rect x=\"8\" y=\"8\" width=\"9\" height=\"12\" rx=\"1.8\"/><path d=\"M10 8V5h5v3M10 5V3h5M17 10l3-2M11 13h3M11 16h3\"/>",
  "accessories": "<path d=\"M5 5c0 8 3 12 7 13 4-1 7-5 7-13\"/><path d=\"m12 18-2 2 2 2 2-2z\"/><circle cx=\"5\" cy=\"4\" r=\"1.2\"/><circle cx=\"19\" cy=\"4\" r=\"1.2\"/>",
  "bags": "<path d=\"M5 9h14l1 12H4z\"/><path d=\"M9 9V7a3 3 0 0 1 6 0v2M8 13v2M16 13v2\"/>",
  "watches": "<path d=\"m9 4 1-2h4l1 2M9 20l1 2h4l1-2\"/><circle cx=\"12\" cy=\"12\" r=\"6\"/><path d=\"M12 8v4l3 2\"/>",
  "beauty": "<path d=\"M9 9h6v11H9zM10 9V5l1-2h2l1 2v4M9 14h6M9 20h6\"/><path d=\"M11 3h2\"/>",
  "electronics": "<rect x=\"7\" y=\"2\" width=\"10\" height=\"20\" rx=\"2.4\"/><path d=\"M10 5h4M11 19h2\"/>",
  "home-appliances": "<rect x=\"4\" y=\"3\" width=\"16\" height=\"18\" rx=\"2\"/><circle cx=\"12\" cy=\"13\" r=\"4.2\"/><path d=\"M7 6h1M10 6h1M15 6h2\"/>",
  "home": "<path d=\"M3 12V9L8 6h8l5 3v3M5 12v8h14v-8\"/><path d=\"M7 15h10v5H7zM7 15v-2h10v2\"/>",
  "sports": "<path d=\"M4 9v6M7 7v10M17 7v10M20 9v6M7 12h10M2 10v4M22 10v4\"/>",
  "toys-kids": "<circle cx=\"9\" cy=\"9\" r=\"2\"/><circle cx=\"15\" cy=\"9\" r=\"2\"/><path d=\"M6 10 5 7l3-3 4 1 4-1 3 3-1 3c2 1 3 3 3 6 0 4-4 6-9 6s-9-2-9-6c0-3 1-5 3-6z\"/><path d=\"M10 15h.01M14 15h.01M10 18c1 1 3 1 4 0\"/>",
  "jewelry": "<path d=\"m7 7 3-5h4l3 5-5 5z\"/><circle cx=\"12\" cy=\"17\" r=\"4.5\"/><path d=\"M7 7h10M10 2l2 5 2-5\"/>",
  "eyewear": "<circle cx=\"6.5\" cy=\"13\" r=\"4.1\"/><circle cx=\"17.5\" cy=\"13\" r=\"4.1\"/><path d=\"M10.6 12.5c1-1.3 1.8-1.3 2.8 0M2.5 12 2 9M21.5 12l.5-3\"/>",
  "automotive": "<path d=\"m5 15 1.5-5 2-3h7l2 3L19 15\"/><rect x=\"3\" y=\"13\" width=\"18\" height=\"6\" rx=\"2\"/><path d=\"M7 19v2M17 19v2M6 14.5h2M16 14.5h2\"/>",
  "stationery-office": "<path d=\"m4 17 1 3 3 1 10-11-4-4zM13 7l4 4M16 3l5 5M4 21l4-1\"/><path d=\"M3 9h6M3 12h4\"/>",
  "gifts": "<rect x=\"3\" y=\"10\" width=\"18\" height=\"11\" rx=\"1\"/><path d=\"M2 7h20v3H2zM12 7v14M12 7c-5 0-7-1-7-4 0-3 6-2 7 4zM12 7c5 0 7-1 7-4 0-3-6-2-7 4z\"/>",
  "restaurants": "<path d=\"M5 3v8M2.5 3v5c0 2 1 3 2.5 3S7.5 10 7.5 8V3M5 11v10M15 3v18M15 3c5 2 6 7 0 11\"/>"
};
window.MIRACategoryIcon=function(slug){const key=Object.prototype.hasOwnProperty.call(shapes,slug)?slug:'gifts';return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" data-category-icon="'+key+'">'+shapes[key]+'</svg>'};
window.MIRACategoryIconSlugs=Object.freeze(Object.keys(shapes));
})();
