import React from 'react';
import { statAbbreviations } from './StatAbbreviations';
import { getStatColor } from './StatColors';

// Define the type of selectedPokemonList
type Pokemon = {
  name: string;
  sprite: string;
  types: string[];
  stats: { name: string; base_stat: number }[];
};

interface Props {
  selectedPokemonList: Pokemon[];
}

const TeamAverageStats: React.FC<Props> = ({ selectedPokemonList }) => {
  // Filter out unselected Pokemon
  const selectedPokemonsWithStats = selectedPokemonList.filter(pokemon => pokemon.stats.length > 0);

  // Calculate the average stats
  const averageStats = selectedPokemonsWithStats.reduce<{ [key: string]: number }>((acc, pokemon) => {
    pokemon.stats.forEach((stat) => {
      acc[stat.name] = (acc[stat.name] || 0) + stat.base_stat;
    });
    return acc;
  }, {});

  // Divide the total stats by the number of selected Pokémon to get the average
  const numPokemon = selectedPokemonsWithStats.length;
  Object.keys(averageStats).forEach((stat) => {
    averageStats[stat] = Math.round(averageStats[stat] / numPokemon);
  });

  return (
    <div className="team-average-stats">
      <h2 className='text-white text-xl mb-5 mt-5'>Team Average Stats</h2>
      <div className="stats-bar-chart">
        {Object.entries(averageStats).map(([stat, value], index) => (
          <div key={index} className="stat-bar">
            <div className="stat-name">{statAbbreviations[stat as keyof typeof statAbbreviations]}</div>
            <div className="stat-value" style={{
              backgroundColor: getStatColor(value),
              width: `${Math.min(Math.max(value / 4, 10), 100)}%` // Set a minimum width of 10% and a maximum width of 100%
            }}>
              {value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeamAverageStats;









