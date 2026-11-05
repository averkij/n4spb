// One hydraulic datum for the connected Neva/canal/harbour network, in world
// metres (street = 0). Independent pond and fountain basins keep their levels.
// Rendering, banks, bridges and boat physics must use this same value; never
// hide a mismatch at an open mouth with a vertical face across the channel.
export const NAVIGABLE_WATER_Y = -3.4;
export const NAVIGABLE_WATER_KEYS = Object.freeze([
  'fontanka', 'griboedov', 'moika', 'winter-canal', 'swan-canal', 'moat',
  'neva', 'kryukov', 'admiralty', 'smolenka', 'gavan', 'nh-inner',
  'malaya-neva', 'karpovka', 'zhdanovka', 'kronverk-moat',
]);
export const NAVIGABLE_WATER_LEVELS = Object.freeze(Object.fromEntries(
  NAVIGABLE_WATER_KEYS.map(key => [key, NAVIGABLE_WATER_Y]),
));
