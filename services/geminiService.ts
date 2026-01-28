
// Fix: Import Type from @google/genai for SDK-compliant schema definitions
import { Type } from "@google/genai";
import { PokemonTeam, PokemonData } from "../types";

/**
 * Helper to call our secure internal backend API
 */
async function callProxyAPI(payload: { prompt: string, isJson?: boolean, schema?: any }) {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to fetch from proxy');
  }

  return await response.json();
}

export async function analyzeTeamSynergy(team: PokemonTeam): Promise<string> {
  const selectedPokemon = team.filter((p): p is NonNullable<typeof p> => p !== null);
  if (selectedPokemon.length === 0) return "Add some Pokémon to your team to get a strategic analysis!";

  const prompt = `
    As a Pokemon Master and strategic analyst, evaluate this competitive team:
    ${selectedPokemon.map(p => `${p.name} (${p.types.map(t => t.name).join('/')})`).join(', ')}.
    
    Provide:
    1. A brief overview of the team's core strategy.
    2. One major weakness they share.
    3. One tactical recommendation to improve coverage.
    
    Keep the response concise, under 150 words. Format with simple bolding.
  `;

  try {
    const result = await callProxyAPI({ prompt });
    return result.text || "Analysis unavailable at this time.";
  } catch (error: any) {
    console.error("AI Analysis Error:", error);
    return "The Team Strategist is currently busy. Please try again later.";
  }
}

export async function suggestFullBuild(pokemon: PokemonData): Promise<{ moves: string[], ability: string, item: string, error?: string }> {
  const prompt = `Suggest a complete high-tier competitive build for ${pokemon.name}.
  The build MUST include:
  1. Exactly 4 real moves this Pokémon can learn.
  2. One of these specific abilities: ${pokemon.abilities.map(a => a.name).join(', ')}.
  3. A standard competitive held item (e.g. Life Orb, Choice Scarf, Leftovers).
  
  Focus on Smogon OU / VGC viability. Provide response in EXACT JSON format.`;

  // Fix: Use Type enum constants from @google/genai instead of string literals for responseSchema
  const schema = {
    type: Type.OBJECT,
    properties: {
      moves: { type: Type.ARRAY, items: { type: Type.STRING } },
      ability: { type: Type.STRING },
      item: { type: Type.STRING }
    },
    required: ["moves", "ability", "item"]
  };

  try {
    const result = await callProxyAPI({ prompt, isJson: true, schema });
    const parsed = JSON.parse(result.text || "{}");
    
    return {
      moves: Array.isArray(parsed.moves) ? parsed.moves.slice(0, 4) : [],
      ability: parsed.ability || pokemon.abilities[0]?.name || '',
      item: parsed.item || ''
    };
  } catch (error: any) {
    console.error("Full Build Suggestion Error:", error);
    return { 
      moves: [], 
      ability: pokemon.selectedAbility || '', 
      item: '',
      error: 'GENERIC_ERROR'
    };
  }
}
