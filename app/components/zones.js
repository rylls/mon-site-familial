export const ZONES = [
  { id: 'cuisine', label: 'Cuisine', x: 160, y: 130, w: 110, h: 65 },
  { id: 'frigo', label: 'Frigo', x: 280, y: 150, w: 60, h: 45 },
  { id: 'eau', label: 'Eau', x: 160, y: 200, w: 180, h: 22 },
  { id: 'gaz', label: 'Gaz', x: 440, y: 200, w: 55, h: 22 },
  { id: 'eclairage', label: 'Éclairage', x: 225, y: 18, w: 210, h: 48 },
  { id: 'rangement', label: 'Rangement', x: 460, y: 125, w: 105, h: 70 },
  { id: 'exterieur', label: 'Extérieur', x: 90, y: 208, w: 90, h: 40 },
];

export const ZONE_LABELS = Object.fromEntries(ZONES.map((z) => [z.id, z.label]));
