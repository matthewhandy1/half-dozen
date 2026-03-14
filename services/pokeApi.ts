
import { PokemonData, MoveDetails, SelectedMove, PokemonAbility } from '../types';
import { TYPE_COLORS, SPECIES_COLORS, GENERATIONS } from '../constants';

/**
 * Formats a PokeAPI slug into a human-readable name, preserving dashes where appropriate.
 */
function formatName(slug: string): string {
  if (!slug) return '';

  // Pokemon with official dashes
  const dashPokemon = ['ho-oh', 'porygon-z', 'hakamo-o', 'jangmo-o', 'kommo-o', 'chi-yu', 'chien-pao', 'ting-lu', 'wo-chien'];
  if (dashPokemon.includes(slug)) {
    return slug.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('-');
  }

  // Moves with official dashes
  const dashMoves: Record<string, string> = {
    'u-turn': 'U-Turn',
    'v-create': 'V-Create',
    'x-scissor': 'X-Scissor',
    'freeze-dry': 'Freeze-Dry',
    'self-destruct': 'Self-Destruct',
    'soft-boiled': 'Soft-Boiled',
    'double-edge': 'Double-Edge',
    'multi-attack': 'Multi-Attack',
    'baby-doll-eyes': 'Baby-Doll Eyes',
    'wake-up-slap': 'Wake-Up Slap',
    'power-up-punch': 'Power-Up Punch',
    'all-out-pummeling': 'All-Out Pummeling',
    'trick-or-treat': 'Trick-or-Treat',
    'topsy-turvy': 'Topsy-Turvy'
  };

  if (dashMoves[slug]) return dashMoves[slug];
  if (slug.match(/^[uvx]-/i)) {
    return slug.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('-');
  }

  // Default: space separated
  return slug.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
}

/**
 * Extracts dominant colors from an image URL using a hidden canvas.
 */
async function getDominantColors(imageUrl: string): Promise<string[]> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(['#1e293b', '#334155']);

      const size = 50; // Downsample for performance
      canvas.width = size;
      canvas.height = size;
      ctx.drawImage(img, 0, 0, size, size);

      const data = ctx.getImageData(0, 0, size, size).data;
      const colorCounts: Record<string, number> = {};

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        // Ignore transparent or near-black/near-white background pixels
        if (a < 128) continue;
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        if (brightness < 20 || brightness > 240) continue;

        // Bucket colors to group similar shades (simplify to 16-bit-ish range)
        const bucketR = Math.round(r / 15) * 15;
        const bucketG = Math.round(g / 15) * 15;
        const bucketB = Math.round(b / 15) * 15;
        const hex = `#${bucketR.toString(16).padStart(2, '0')}${bucketG.toString(16).padStart(2, '0')}${bucketB.toString(16).padStart(2, '0')}`;
        
        colorCounts[hex] = (colorCounts[hex] || 0) + 1;
      }

      const sortedColors = Object.entries(colorCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([hex]) => hex);

      if (sortedColors.length >= 2) {
        resolve([sortedColors[0], sortedColors[1]]);
      } else if (sortedColors.length === 1) {
        resolve([sortedColors[0], sortedColors[0]]);
      } else {
        resolve(['#1e293b', '#334155']);
      }
    };
    img.onerror = () => resolve(['#1e293b', '#334155']);
    img.src = imageUrl;
  });
}

/**
 * Maps generation IDs to PokeAPI version group names.
 */
const GEN_TO_VERSION_GROUPS: Record<number, string[]> = {
  1: ['red-blue', 'yellow'],
  2: ['gold-silver', 'crystal'],
  3: ['ruby-sapphire', 'emerald', 'firered-leafgreen'],
  4: ['diamond-pearl', 'platinum', 'heartgold-soulsilver'],
  5: ['black-white', 'black-2-white-2'],
  6: ['x-y', 'omega-ruby-alpha-sapphire'],
  7: ['sun-moon', 'ultra-sun-ultra-moon', 'lets-go-pikachu-lets-go-eevee'],
  8: ['sword-shield', 'brilliant-diamond-shining-pearl', 'legends-arceus'],
  9: ['scarlet-violet'],
  10: ['firered-leafgreen'], // FRLG
  11: ['heartgold-soulsilver'], // HGSS
  12: ['omega-ruby-alpha-sapphire'], // ORAS
  13: ['lets-go-pikachu-lets-go-eevee'], // LGPE
  14: ['brilliant-diamond-shining-pearl'], // BDSP
};

/**
 * Full fetch for the active team cards.
 */
export async function fetchPokemon(identifier: string | number, genId: number = 9): Promise<PokemonData> {
  const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${identifier.toString().toLowerCase()}`);
  if (!response.ok) {
    throw new Error('Pokemon not found');
  }
  const data = await response.json();

  // Fetch species color
  let speciesHex = '#475569'; // Default gray
  try {
    const speciesRes = await fetch(data.species.url);
    if (speciesRes.ok) {
      const speciesData = await speciesRes.json();
      speciesHex = SPECIES_COLORS[speciesData.color.name] || speciesHex;
    }
  } catch (e) {
    console.warn('Could not fetch species color');
  }

  // Fetch descriptions for all abilities
  const abilityPromises = data.abilities.map(async (a: any): Promise<PokemonAbility> => {
    try {
      const abilityRes = await fetch(a.ability.url);
      const abilityData = await abilityRes.json();
      const entry = abilityData.effect_entries.find((e: any) => e.language.name === 'en');
      return {
        name: a.ability.name,
        description: entry ? entry.short_effect : 'No description available.',
      };
    } catch (e) {
      return { name: a.ability.name, description: 'Could not load description.' };
    }
  });

  const abilities = await Promise.all(abilityPromises);
  const spriteUrl = data.sprites.other['official-artwork'].front_default || data.sprites.front_default;
  const dominantColors = await getDominantColors(spriteUrl);
  const speciesName = data.species.name;

  // Filter moves by generation
  const versionGroups = GEN_TO_VERSION_GROUPS[genId] || ['scarlet-violet'];
  const availableMoves = data.moves
    .filter((m: any) => 
      m.version_group_details.some((detail: any) => 
        versionGroups.includes(detail.version_group.name)
      )
    )
    .map((m: any) => formatName(m.move.name))
    .sort();

  return {
    id: data.id,
    name: formatName(data.name),
    sprite: spriteUrl,
    types: data.types.map((t: any) => ({
      name: t.type.name,
      color: TYPE_COLORS[t.type.name] || '#777',
    })),
    stats: data.stats.map((s: any) => ({
      name: s.stat.name,
      value: s.base_stat,
    })),
    abilities: abilities,
    availableMoves: availableMoves.length > 0 ? availableMoves : data.moves.map((m: any) => formatName(m.move.name)).sort(),
    selectedMoves: Array.from({ length: 4 }, () => ({ name: '', type: '', damageClass: '', power: null })),
    selectedAbility: abilities[0]?.name,
    selectedNature: '',
    selectedItem: '',
    selectedItemDescription: '',
    speciesColor: speciesHex,
    speciesName: speciesName,
    dominantColors
  };
}

/**
 * Light fetch for Enemy Scouting. 
 */
export async function fetchPokemonBasic(identifier: string | number): Promise<PokemonData> {
  const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${identifier.toString().toLowerCase()}`);
  if (!response.ok) throw new Error('Pokemon not found');
  const data = await response.json();

  // Fetch species color for consistency
  let speciesHex = '#475569';
  try {
    const speciesRes = await fetch(data.species.url);
    if (speciesRes.ok) {
      const speciesData = await speciesRes.json();
      speciesHex = SPECIES_COLORS[speciesData.color.name] || speciesHex;
    }
  } catch (e) {}

  const spriteUrl = data.sprites.other['official-artwork'].front_default || data.sprites.front_default;
  const dominantColors = await getDominantColors(spriteUrl);

  return {
    id: data.id,
    name: formatName(data.name),
    sprite: spriteUrl,
    types: data.types.map((t: any) => ({
      name: t.type.name,
      color: TYPE_COLORS[t.type.name] || '#777',
    })),
    stats: [], 
    abilities: [],
    availableMoves: [],
    selectedMoves: Array.from({ length: 4 }, () => ({ name: '', type: '', damageClass: '', power: null })),
    selectedNature: '',
    speciesColor: speciesHex,
    dominantColors
  };
}

export async function fetchAllPokemonNames(genId: number = 9): Promise<{ name: string; id: number }[]> {
  const gen = GENERATIONS.find(g => g.id === genId);
  const limit = 2000; // Increase to 2000 to include all regional forms and variants (Mega, G-Max, etc.)
  
  const response = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${limit}`);
  const data = await response.json();
  
  return data.results.map((r: any) => {
    const id = parseInt(r.url.split('/').filter(Boolean).pop() || '0');
    return {
      name: formatName(r.name),
      id: id, 
    };
  }).filter((p: any) => {
    // If the "Latest" generation (Gen 9) is selected, show everything including forms
    if (genId === 9) return true;
    
    // If a specific generation is selected, only show the base species range (exclude forms > 10000)
    if (gen) {
      return p.id <= gen.limit;
    }
    
    return true;
  });
}

export async function fetchAllMoves(): Promise<string[]> {
  const response = await fetch('https://pokeapi.co/api/v2/move?limit=1500');
  const data = await response.json();
  return data.results.map((r: any) => formatName(r.name)).sort();
}

export async function fetchAllAbilities(): Promise<string[]> {
  const response = await fetch('https://pokeapi.co/api/v2/ability?limit=1000');
  const data = await response.json();
  return data.results.map((r: any) => formatName(r.name)).sort();
}

export async function fetchPokemonByType(type: string): Promise<{ name: string; id: number }[]> {
  const response = await fetch(`https://pokeapi.co/api/v2/type/${type.toLowerCase()}`);
  if (!response.ok) return [];
  const data = await response.json();
  return data.pokemon.map((p: any) => {
    const id = parseInt(p.pokemon.url.split('/').filter(Boolean).pop() || '0');
    return { name: formatName(p.pokemon.name), id };
  });
}

export async function fetchPokemonByAbility(ability: string): Promise<{ name: string; id: number }[]> {
  const formattedAbility = ability.toLowerCase().replace(/\s+/g, '-');
  const response = await fetch(`https://pokeapi.co/api/v2/ability/${formattedAbility}`);
  if (!response.ok) return [];
  const data = await response.json();
  return data.pokemon.map((p: any) => {
    const id = parseInt(p.pokemon.url.split('/').filter(Boolean).pop() || '0');
    return { name: formatName(p.pokemon.name), id };
  });
}

export async function fetchPokemonByGeneration(genId: number): Promise<{ name: string; id: number }[]> {
  const response = await fetch(`https://pokeapi.co/api/v2/generation/${genId}`);
  if (!response.ok) return [];
  const data = await response.json();
  return data.pokemon_species.map((p: any) => {
    const id = parseInt(p.url.split('/').filter(Boolean).pop() || '0');
    return { name: formatName(p.name), id };
  });
}

export async function fetchAllItems(): Promise<string[]> {
  const categoryIds = [3, 12, 13, 19];
  try {
    const promises = categoryIds.map(id => 
      fetch(`https://pokeapi.co/api/v2/item-category/${id}/`).then(res => res.ok ? res.json() : { items: [] }).catch(() => ({ items: [] }))
    );
    const results = await Promise.all(promises);
    const itemSet = new Set<string>();
    results.forEach(data => {
      if (data.items) {
        data.items.forEach((item: any) => {
          const formatted = item.name.split('-').map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
          itemSet.add(formatted);
        });
      }
    });
    return Array.from(itemSet).sort();
  } catch (error) {
    return ['Leftovers', 'Life Orb', 'Choice Band', 'Choice Scarf', 'Choice Specs', 'Focus Sash', 'Rocky Helmet', 'Assault Vest', 'Eviolite', 'Heavy-Duty Boots'];
  }
}

export async function fetchItemDescription(itemName: string): Promise<string> {
  const formattedName = itemName.toLowerCase().replace(/\s+/g, '-').replace(/[^-a-z0-9]/g, '');
  try {
    const response = await fetch(`https://pokeapi.co/api/v2/item/${formattedName}`);
    if (!response.ok) return 'No description available.';
    const data = await response.json();
    
    // Check main effect entries first
    const effectEntry = data.effect_entries?.find((e: any) => e.language.name === 'en');
    if (effectEntry) return effectEntry.short_effect;
    
    // Fallback to flavor text (where Heavy-Duty Boots description lives)
    const flavorEntry = data.flavor_text_entries?.find((e: any) => e.language.name === 'en');
    if (flavorEntry) return flavorEntry.text.replace(/\f/g, ' ');

    return 'No description available.';
  } catch (e) {
    return 'Description unavailable.';
  }
}

export async function fetchMoveDetails(moveName: string): Promise<MoveDetails> {
  const formattedName = moveName.toLowerCase().replace(/\s+/g, '-').replace(/[^-a-z0-9]/g, '');
  const response = await fetch(`https://pokeapi.co/api/v2/move/${formattedName}`);
  if (!response.ok) throw new Error('Move not found');
  const data = await response.json();

  let effectText = data.effect_entries.find((e: any) => e.language.name === 'en')?.short_effect || 'No description available.';
  
  // Inject the actual numerical effect chance if it exists
  if (data.effect_chance !== null && data.effect_chance !== undefined) {
    effectText = effectText.replace(/\$effect_chance/g, data.effect_chance.toString());
  }

  return {
    name: formatName(data.name),
    type: data.type.name,
    power: data.power,
    accuracy: data.accuracy,
    pp: data.pp,
    damageClass: data.damage_class.name,
    effect: effectText,
  };
}

export async function fetchEvolutionChain(pokemonId: number): Promise<string[]> {
  try {
    const speciesRes = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokemonId}/`);
    if (!speciesRes.ok) return [];
    const speciesData = await speciesRes.json();
    
    const chainRes = await fetch(speciesData.evolution_chain.url);
    if (!chainRes.ok) return [];
    const chainData = await chainRes.json();
    
    const names: string[] = [];
    let current = chainData.chain;
    
    const traverse = (node: any) => {
      names.push(node.species.name);
      node.evolves_to.forEach((evolution: any) => traverse(evolution));
    };
    
    traverse(current);
    return names;
  } catch (e) {
    console.error("Evolution Fetch Error:", e);
    return [];
  }
}
