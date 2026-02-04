
export interface PokemonStat {
  name: string;
  value: number;
}

export interface PokemonType {
  name: string;
  color: string;
}

export interface PokemonAbility {
  name: string;
  description: string;
}

export interface MoveDetails {
  name: string;
  type: string;
  power: number | null;
  accuracy: number | null;
  pp: number;
  damageClass: string;
  effect: string;
}

export interface SelectedMove {
  name: string;
  type: string;
  damageClass: string;
  power: number | null;
}

export interface PokemonData {
  id: number;
  name: string;
  nickname?: string;
  sprite: string;
  types: PokemonType[];
  stats: PokemonStat[]; // Can be empty in storage
  abilities: PokemonAbility[]; // Can be empty in storage
  availableMoves?: string[]; // Optional in storage to save massive space
  selectedMoves: SelectedMove[]; 
  selectedAbility?: string;
  selectedNature?: string;
  selectedItem?: string;
  selectedItemDescription?: string;
  customTypes?: string[]; 
  speciesColor?: string;
  dominantColors?: string[];
}

export interface BoxPokemon extends PokemonData {
  instanceId: string;
}

export type PokemonTeam = (PokemonData | null)[];

export interface SavedTeam {
  id: string;
  name: string;
  pokemon: PokemonTeam;
  timestamp: number;
}

export interface SavedEnemyTeam {
  id: string;
  name: string;
  pokemon: (Partial<PokemonData> | null)[];
  timestamp: number;
  avatar?: string;
  region?: string;
  isLegacy?: boolean;
}

export interface UserProfile {
  name: string;
  trainerClass: string;
  joinedAt: number;
  trainerId: string;
  avatar: string;
}

export interface MasterSyncPackage {
  profile: UserProfile;
  team: PokemonTeam;
  box: BoxPokemon[];
  teams: SavedTeam[];
  enemyTeams: SavedEnemyTeam[];
  version: string;
}
