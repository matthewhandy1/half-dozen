import { PokemonData, SelectedMove } from './types';
import { fetchPokemon, fetchMoveDetails, fetchItemDescription } from './services/pokeApi';

export interface RivalTeam {
  id: string;
  name: string;
  category: 'gym' | 'elite' | 'champion' | 'rival';
  region: string;
  avatar: string;
  pokemon: (string | number)[];
}

export const KANTO_RIVALS: RivalTeam[] = [
  // Gym Leaders
  { id: 'k-gym-1', name: 'Brock', category: 'gym', region: 'Kanto', avatar: 'brock', pokemon: [74, 95] },
  { id: 'k-gym-2', name: 'Misty', category: 'gym', region: 'Kanto', avatar: 'misty', pokemon: [120, 121] },
  { id: 'k-gym-3', name: 'Lt. Surge', category: 'gym', region: 'Kanto', avatar: 'ltsurge', pokemon: [100, 25, 26] },
  { id: 'k-gym-4', name: 'Erika', category: 'gym', region: 'Kanto', avatar: 'erika', pokemon: [71, 114, 45] },
  { id: 'k-gym-5', name: 'Koga', category: 'gym', region: 'Kanto', avatar: 'koga', pokemon: [109, 89, 109, 110] },
  { id: 'k-gym-6', name: 'Sabrina', category: 'gym', region: 'Kanto', avatar: 'sabrina', pokemon: [64, 122, 49, 65] },
  { id: 'k-gym-7', name: 'Blaine', category: 'gym', region: 'Kanto', avatar: 'blaine', pokemon: [58, 77, 78, 59] },
  { id: 'k-gym-8', name: 'Giovanni', category: 'gym', region: 'Kanto', avatar: 'giovanni', pokemon: [111, 51, 31, 34, 112] },
  
  // Elite Four
  { id: 'k-e4-1', name: 'Lorelei', category: 'elite', region: 'Kanto', avatar: 'lorelei', pokemon: [87, 91, 80, 124, 131] },
  { id: 'k-e4-2', name: 'Bruno', category: 'elite', region: 'Kanto', avatar: 'bruno', pokemon: [95, 106, 107, 95, 68] },
  { id: 'k-e4-3', name: 'Agatha', category: 'elite', region: 'Kanto', avatar: 'agatha', pokemon: [93, 42, 93, 24, 94] },
  { id: 'k-e4-4', name: 'Lance', category: 'elite', region: 'Kanto', avatar: 'lance', pokemon: [130, 148, 148, 142, 149] },
  
  // Champion
  { id: 'k-champ-1', name: 'Blue', category: 'champion', region: 'Kanto', avatar: 'blue', pokemon: [18, 65, 112, 103, 130, 6] },
];

export async function hydrateRivalTeam(rival: RivalTeam): Promise<PokemonData[]> {
  const pkmn = await Promise.all(rival.pokemon.map(async (id) => {
    try {
      return await fetchPokemon(id);
    } catch (e) {
      console.error(`Failed to fetch rival pokemon ${id}`, e);
      return null;
    }
  }));
  return pkmn.filter((p): p is PokemonData => p !== null);
}
