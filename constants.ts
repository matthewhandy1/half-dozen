
export const TYPE_COLORS: Record<string, string> = {
  normal: '#A8A77A',
  fire: '#EE8130',
  water: '#6390F0',
  electric: '#F7D02C',
  grass: '#7AC74C',
  ice: '#96D9D6',
  fighting: '#C22E28',
  poison: '#A33EA1',
  ground: '#E2BF65',
  flying: '#A98FF3',
  psychic: '#F95587',
  bug: '#A6B91A',
  rock: '#B6A136',
  ghost: '#735797',
  dragon: '#6F35FC',
  dark: '#705746',
  steel: '#B7B7CE',
  fairy: '#D685AD',
};

export const SPECIES_COLORS: Record<string, string> = {
  black: '#1e293b',
  blue: '#2563eb',
  brown: '#92400e',
  gray: '#475569',
  green: '#16a34a',
  pink: '#db2777',
  purple: '#7c3aed',
  red: '#dc2626',
  white: '#94a3b8',
  yellow: '#ca8a04',
};

export const POKEMON_TYPES = Object.keys(TYPE_COLORS);

export const GENERATIONS = [
  { id: 1, name: 'Gen 1', region: 'Kanto', limit: 151 },
  { id: 2, name: 'Gen 2', region: 'Johto', limit: 251 },
  { id: 3, name: 'Gen 3', region: 'Hoenn', limit: 386 },
  { id: 4, name: 'Gen 4', region: 'Sinnoh', limit: 493 },
  { id: 5, name: 'Gen 5', region: 'Unova', limit: 649 },
  { id: 6, name: 'Gen 6', region: 'Kalos', limit: 721 },
  { id: 7, name: 'Gen 7', region: 'Alola', limit: 809 },
  { id: 8, name: 'Gen 8', region: 'Galar', limit: 898 },
  { id: 9, name: 'Gen 9', region: 'Paldea', limit: 1025 },
];

// Modern Chart (Gen 6+)
const MODERN_CHART: Record<string, Record<string, number>> = {
  normal: { rock: 0.5, ghost: 0, steel: 0.5 },
  fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
  water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  grass: { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
  ice: { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
  fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
  poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
  ground: { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
  flying: { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
  psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug: { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
  rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
  ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
  dragon: { dragon: 2, steel: 0.5, fairy: 0 },
  dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
  steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
  fairy: { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 },
};

// Gen 2-5 Chart (Pre-Fairy)
const GEN2_5_CHART: Record<string, Record<string, number>> = {
  ...MODERN_CHART,
  ghost: { ...MODERN_CHART.ghost, steel: 0.5 }, // Steel resisted Ghost/Dark before Gen 6
  dark: { ...MODERN_CHART.dark, steel: 0.5 },
};
// Remove Fairy matchups
Object.keys(GEN2_5_CHART).forEach(k => {
  const { fairy, ...rest } = GEN2_5_CHART[k];
  GEN2_5_CHART[k] = rest;
});

// Gen 1 Chart (No Steel/Dark/Fairy + Quirks)
const GEN1_CHART: Record<string, Record<string, number>> = {
  normal: { rock: 0.5, ghost: 0 },
  fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5 },
  water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  grass: { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5 },
  ice: { water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, fire: 1 }, // Ice was 1x against Fire in Gen 1
  fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0 },
  poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, bug: 2 }, // Poison SE against Bug in Gen 1
  ground: { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2 },
  flying: { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5 },
  psychic: { fighting: 2, poison: 2, psychic: 0.5, ghost: 0 }, // Psychic immune to Ghost in Gen 1 (bug)
  bug: { fire: 0.5, grass: 2, fighting: 0.5, poison: 2, flying: 0.5, psychic: 2, ghost: 0.5 }, // Bug SE against Poison in Gen 1
  rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2 },
  ghost: { normal: 0, psychic: 0, ghost: 2 }, // Ghost had NO effect on Psychic in Gen 1 (bug)
  dragon: { dragon: 2 },
};

export const getChartForGen = (genId: number) => {
  if (genId === 1) return GEN1_CHART;
  if (genId <= 5) return GEN2_5_CHART;
  return MODERN_CHART;
};

export const getTypesForGen = (genId: number) => {
  const types = [...POKEMON_TYPES];
  if (genId === 1) return types.filter(t => t !== 'dark' && t !== 'steel' && t !== 'fairy');
  if (genId <= 5) return types.filter(t => t !== 'fairy');
  return types;
};

export const TYPE_CHART = MODERN_CHART; // Default fallback

export const STAT_ABBREVIATIONS: Record<string, string> = {
  hp: 'HP',
  attack: 'ATK',
  defense: 'DEF',
  'special-attack': 'SPA',
  'special-defense': 'SPD',
  speed: 'SPE',
};

export interface NatureEffect {
  increased: string | null;
  decreased: string | null;
}

export const NATURES: Record<string, NatureEffect> = {
  Adamant: { increased: 'attack', decreased: 'special-attack' },
  Bashful: { increased: null, decreased: null },
  Bold: { increased: 'defense', decreased: 'attack' },
  Brave: { increased: 'attack', decreased: 'speed' },
  Calm: { increased: 'special-defense', decreased: 'attack' },
  Careful: { increased: 'special-defense', decreased: 'special-attack' },
  Docile: { increased: null, decreased: null },
  Gentle: { increased: 'special-defense', decreased: 'defense' },
  Hardy: { increased: null, decreased: null },
  Hasty: { increased: 'speed', decreased: 'defense' },
  Impish: { increased: 'defense', decreased: 'special-attack' },
  Jolly: { increased: 'speed', decreased: 'special-attack' },
  Lax: { increased: 'defense', decreased: 'special-defense' },
  Lonely: { increased: 'attack', decreased: 'defense' },
  Mild: { increased: 'special-attack', decreased: 'defense' },
  Modest: { increased: 'special-attack', decreased: 'attack' },
  Naive: { increased: 'speed', decreased: 'special-defense' },
  Naughty: { increased: 'attack', decreased: 'special-defense' },
  Quiet: { increased: 'special-attack', decreased: 'speed' },
  Quirky: { increased: null, decreased: null },
  Rash: { increased: 'special-attack', decreased: 'special-defense' },
  Relaxed: { increased: 'defense', decreased: 'speed' },
  Sassy: { increased: 'special-defense', decreased: 'speed' },
  Serious: { increased: null, decreased: null },
  Timid: { increased: 'speed', decreased: 'attack' },
};
