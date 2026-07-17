// Coordonnées en pourcentage de l'image public/images/van-cutaway.png
export const ZONES = [
  { id: 'cuisine', label: 'Cuisine', x: 43.5, y: 43.1, w: 21, h: 16.5 },
  { id: 'frigo', label: 'Frigo', x: 50.5, y: 58.7, w: 11, h: 17.4 },
  { id: 'eau', label: 'Eau', x: 43.5, y: 59.6, w: 7, h: 16.5 },
  { id: 'gaz', label: 'Gaz', x: 88, y: 68.7, w: 11, h: 13.7 },
  { id: 'eclairage', label: 'Éclairage', x: 45, y: 35.7, w: 17.5, h: 6.4 },
  { id: 'rangement', label: 'Rangement', x: 64.5, y: 35.7, w: 16.5, h: 23.8 },
  { id: 'exterieur', label: 'Extérieur', x: 70, y: 1, w: 29, h: 34 },
];

export const ZONE_LABELS = Object.fromEntries(ZONES.map((z) => [z.id, z.label]));
