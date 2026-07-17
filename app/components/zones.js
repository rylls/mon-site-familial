// Coordonnées en pourcentage de l'image public/images/van-cutaway.png
export const ZONES = [
  { id: 'couchages', label: 'Couchages', x: 37.5, y: 24, w: 25.6, h: 11 },
  { id: 'cuisine', label: 'Cuisine', x: 43.75, y: 51.5, w: 22.5, h: 12.6 },
  { id: 'frigo', label: 'Frigo', x: 51.25, y: 60.1, w: 9, h: 15.5 },
  { id: 'utilitaire', label: 'Utilitaire', x: 43.75, y: 64.1, w: 7.2, h: 10.3 },
  { id: 'gaz', label: 'Liquides', x: 80.6, y: 68.4, w: 6.25, h: 11.2 },
  { id: 'eclairage', label: 'Éclairage', x: 45.6, y: 34.9, w: 15.9, h: 5.7 },
  { id: 'rangement', label: 'Rangement', x: 71.25, y: 37.8, w: 9.4, h: 19.5 },
  { id: 'mecanique', label: 'Mécanique', x: 5, y: 60, w: 14, h: 20 },
];

export const ZONE_LABELS = Object.fromEntries(ZONES.map((z) => [z.id, z.label]));
