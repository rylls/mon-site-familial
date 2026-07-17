export const ZONES = [
  { id: 'cuisine', label: 'Cuisine', x: 330, y: 150, w: 110, h: 60 },
  { id: 'frigo', label: 'Frigo', x: 250, y: 150, w: 70, h: 60 },
  { id: 'eau', label: 'Eau', x: 330, y: 215, w: 110, h: 30 },
  { id: 'gaz', label: 'Gaz', x: 445, y: 150, w: 60, h: 60 },
  { id: 'eclairage', label: 'Éclairage', x: 90, y: 60, w: 460, h: 26 },
  { id: 'rangement', label: 'Rangement', x: 90, y: 150, w: 150, h: 95 },
  { id: 'exterieur', label: 'Extérieur', x: 505, y: 90, w: 90, h: 120 },
];

export const ZONE_LABELS = Object.fromEntries(ZONES.map((z) => [z.id, z.label]));
