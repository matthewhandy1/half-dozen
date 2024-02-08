'use client';

import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { useDebounce } from 'use-debounce';
import typeColors from './TypeColors';
import { TypeEffectiveness, typeEffectiveness } from './TypeEffectiveness';
import { statAbbreviations } from './StatAbbreviations';
import { getStatColor } from './StatColors';
import TeamAverageStats from './TeamAverageStats';

interface Pokemon {
  name: string;
}

interface PokemonDetails {
  name: string; // Include the name property
  types: string[];
  sprite: string;
  stats: { name: string; base_stat: number }[];
  abilities: string[];

}
interface ImmunityAbilitiesMap {
  [key: string]: string[];
}

const immunityAbilitiesMap: ImmunityAbilitiesMap = {
  'levitate': ['ground'],
  'volt-absorb': ['electric'],
  'flash-fire': ['fire'],
  'wonder-guard': ['normal', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison', 'ground', 'psychic', 'bug', 'dragon', 'steel', 'fairy'],
  'lightning-rod': ['electric'],
  'motor-drive': ['electric'],
  'water-absorb': ['water'],
  'dry-skin': ['water'],
  'sap-sipper': ['grass'],
  'earth-eater': ['ground']
};





const PokemonList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [pokemonList, setPokemonList] = useState<Pokemon[]>([]);
  const [pokemonInputs, setPokemonInputs] = useState<{ name: string; value: string }[]>(new Array(6).fill({ name: '', value: '' }));
  const [selectedPokemonList, setSelectedPokemonList] = useState<PokemonDetails[]>([]);
  const [selectedAbilities, setSelectedAbilities] = useState<string[]>(new Array(6).fill(''));
  const [teamName, setTeamName] = useState<string>('');
  const [savedTeams, setSavedTeams] = useState<string[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [customTypeSelections, setCustomTypeSelections] = useState<(string[] | null)[]>(new Array(6).fill(null)); // State to store custom type selections
  const [showCustomTypeOptions, setShowCustomTypeOptions] = useState<boolean>(false); // State variable to track visibility of custom type options

  const toggleCustomTypeOptions = () => {
    setShowCustomTypeOptions(!showCustomTypeOptions);
  };





  // Effect hook to recalculate combined strengths and weaknesses when selectedAbilities or customTypeSelections change
  useEffect(() => {
    calculateCombinedTypeChart();
  }, [selectedAbilities, customTypeSelections]);





  useEffect(() => {
    // Load saved team names from local storage on component mount
    const savedTeamNames = JSON.parse(localStorage.getItem('savedTeams') || '[]');
    setSavedTeams(savedTeamNames);
  }, []);

  const saveSelections = () => {
    const dataToSave = {
      selectedPokemonList,
      selectedAbilities,
      customTypeSelections, // Include customTypeSelections in the saved data
    };
    const teams = JSON.parse(localStorage.getItem('teams') || '{}');
    teams[teamName] = dataToSave;
    localStorage.setItem('teams', JSON.stringify(teams));
    // Update saved team names
    if (!savedTeams.includes(teamName)) {
      setSavedTeams([...savedTeams, teamName]);
      localStorage.setItem('savedTeams', JSON.stringify([...savedTeams, teamName]));
    }
  };

  const loadSelections = () => {
    const teams = JSON.parse(localStorage.getItem('teams') || '{}');
    const selectedTeamData = teams[selectedTeam];
    if (selectedTeamData) {
      setSelectedPokemonList(selectedTeamData.selectedPokemonList);
      setSelectedAbilities(selectedTeamData.selectedAbilities);
      setCustomTypeSelections(selectedTeamData.customTypeSelections || []); // Set customTypeSelections if available
      // Update pokemonInputs state with the names of the loaded team
      const newInputs = selectedTeamData.selectedPokemonList.map((pokemon: PokemonDetails) => ({ name: pokemon.name, value: pokemon.name }));
      setPokemonInputs(newInputs);
    }
  };


  const handleSaveClick = () => {
    saveSelections();
    alert('Selections saved successfully!');
  };

  const handleLoadClick = () => {
    loadSelections();
  };

  const handleTeamNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTeamName(e.target.value);
  };

  const handleTeamSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTeam(e.target.value);
  };











  const [chartLoaded, setChartLoaded] = useState<boolean>(false); // Set initial state to false


  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);

  const fetchPokemonNames = async () => {
    try {
      const response = await axios.get(`https://pokeapi.co/api/v2/pokemon?limit=1400`);
      const names: string[] = response.data.results.map((pokemon: { name: string }) => pokemon.name);
      setPokemonList(names.map(name => ({ name })));
    } catch (error) {
      console.error('Error fetching Pokemon data:', error);
    }
  };

  const fetchPokemonDetails = async (name: string): Promise<PokemonDetails> => {
    try {
      const response = await axios.get(`https://pokeapi.co/api/v2/pokemon/${name}`);

      const types: string[] = response.data.types.map((type: { type: { name: string } }) => type.type.name);
      const sprite: string = response.data.sprites.front_default;
      const stats: { name: string; base_stat: number }[] = response.data.stats.map((stat: { stat: { name: string }; base_stat: number }) => ({
        name: stat.stat.name,
        base_stat: stat.base_stat,
      }));
      const abilities: string[] = response.data.abilities.map((ability: { ability: { name: string } }) => ability.ability.name); // Add abilities

      return { name, types, sprite, stats, abilities }; // Include the 'name' property
    } catch (error) {
      console.error('Error fetching Pokemon details:', error);
      return { name: '', types: [], sprite: '', stats: [], abilities: [] }; // Ensure all properties are included in case of error
    }
  };




  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const newName = e.target.value.trim();
    const prevName = pokemonInputs[index].name;

    const newInputs = [...pokemonInputs];
    newInputs[index] = { name: newName, value: e.target.value };
    setPokemonInputs(newInputs);

    if (newName === '') {
      // Clear Pokemon details if input is empty
      setSelectedPokemonList((prevList) => {
        const newList = [...prevList];
        newList[index] = { name: '', types: [], sprite: '', stats: [], abilities: [] };
        return newList;
      });
    } else {
      try {
        const { types, sprite, stats, abilities } = await fetchPokemonDetails(newName);

        setSelectedPokemonList((prevList) => {
          const newList = [...prevList];
          newList[index] = { name: newName, types, sprite, stats, abilities };
          return newList;
        });

        // Update type effectiveness chart and total resistance tally
        calculateCombinedTypeChart();
        calculateTotalWeaknessesAndResistances();
      } catch (error) {
        console.error('Error fetching Pokemon details:', error);
      }
    }
  };

  const handleAbilitySelection = (ability: string, index: number) => {
    const newAbilities = [...selectedAbilities];
    newAbilities[index] = ability;
    setSelectedAbilities(newAbilities);
  };

  // Function to toggle ability selection
  const handleAbilitySelectionToggle = (ability: string, index: number) => {
    const newAbilities = [...selectedAbilities];
    // If the ability is already selected, deselect it; otherwise, select it
    newAbilities[index] = newAbilities[index] === ability ? '' : ability;
    setSelectedAbilities(newAbilities);
  };


  // New state variables for combined strengths and weaknesses
  const [combinedTypeChart, setCombinedTypeChart] = useState<Record<string, number | string>[]>(new Array(6).fill({}));




  useEffect(() => {
    fetchPokemonNames().then(() => {
      setSelectedPokemonList(new Array(6).fill({ name: '', sprite: '', types: [], stats: [], abilities: [] }));
      setChartLoaded(true); // Set chartLoaded to true after setting the selectedPokemonList
    });
  }, []);



  const calculateCombinedTypeChart = () => {
    const combinedChart: Record<string, number | string>[] = [];

    selectedPokemonList.forEach((pokemon, pokemonIndex) => {
      const chart: Record<string, number | string> = {};
      const customTypes = customTypeSelections[pokemonIndex] || pokemon.types; // Use custom types if available, otherwise use original types

      Object.keys(typeEffectiveness).forEach((type) => {
        let strengthCount = 0;
        let weaknessCount = 0;
        let immunity = false; // Flag to track immunity

        customTypes.forEach((defensiveType) => {
          const effectiveness = typeEffectiveness[type as keyof TypeEffectiveness][defensiveType];
          if (effectiveness === 0) {
            immunity = true;
          } else if (effectiveness === 0.25 || effectiveness === 0.5) {
            weaknessCount += 1;
          } else if (effectiveness === 2) {
            strengthCount += 1;
          }
        });

        if (immunity) {
          chart[type] = 'IMMUNE';
          return; // No need to continue calculating strengths/weaknesses if immune
        }

        const strengthWeakness = strengthCount - weaknessCount;

        // Check if the ability checkbox is checked
        if (selectedAbilities[pokemonIndex]) {
          const abilityName = selectedAbilities[pokemonIndex] as string;
          const immunityTypes = immunityAbilitiesMap[abilityName];

          if (immunityTypes && immunityTypes.includes(type)) {
            // Set type effectiveness to immune only if the checkbox is checked
            if (selectedAbilities[pokemonIndex] === pokemon.abilities.find((ability) => ability === selectedAbilities[pokemonIndex])) {
              chart[type] = 'IMMUNE';
              return;
            }
          }
        }

        chart[type] = strengthWeakness;
      });

      combinedChart.push(chart);
    });

    setCombinedTypeChart(combinedChart);
  };













  const calculateTotalWeaknessesAndResistances = () => {
    const totalWeaknesses: Record<string, number> = {};
    const totalResistances: Record<string, number> = {};

    combinedTypeChart.forEach((chart) => {
      Object.entries(chart).forEach(([type, value]) => {
        if (typeof value === 'number') {
          if (value === -2) {
            totalResistances[type] = (totalResistances[type] || 0) + 1;
          } else if (value === -1) {
            totalResistances[type] = (totalResistances[type] || 0) + 1;
          } else if (value === 1) {
            totalWeaknesses[type] = (totalWeaknesses[type] || 0) + 1;
          } else if (value === 2) {
            totalWeaknesses[type] = (totalWeaknesses[type] || 0) + 1;
          }
        } else if (value === 'IMMUNE') {
          totalResistances[type] = (totalResistances[type] || 0) + 1; // Increment resistance count for immunity
        }
      });
    });

    return { totalWeaknesses, totalResistances };
  };

  // Inside the component
  const { totalWeaknesses, totalResistances } = calculateTotalWeaknessesAndResistances();


  // Calculate combined strengths and weaknesses when the component mounts
  useEffect(() => {
    calculateCombinedTypeChart(); // Calculate the combined type chart
  }, []);


  // Effect hook to recalculate combined weaknesses and resistances when selectedPokemonList changes
  useEffect(() => {
    calculateCombinedTypeChart();
  }, [selectedPokemonList]);



  const renderCustomTypeSelections = (index: number) => {
    if (!showCustomTypeOptions) {
      return null;
    }

    return (
      <div key={index}>
        <div className='mb-5 custom-type-wrap'>
          <label className='text-white'>Select 1st custom type: </label>
          <select
            value={customTypeSelections[index]?.[0] || ''}
            onChange={(e) => handleCustomTypeChange(index, [e.target.value, customTypeSelections[index]?.[1] || ''])}
          >
            <option value="">Select type</option>
            {/* Render options for custom types */}
            {Object.keys(typeEffectiveness).map((type, i) => (
              <option key={i} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        <div className='custom-type-wrap'>
          <label className='text-white'>Select 2nd custom type: </label>
          <select
            value={customTypeSelections[index]?.[1] || ''}
            onChange={(e) => handleCustomTypeChange(index, [customTypeSelections[index]?.[0] || '', e.target.value])}
          >
            <option value="">Select type</option>
            {/* Render options for custom types */}
            {Object.keys(typeEffectiveness).map((type, i) => (
              <option key={i} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  };




  const handleCustomTypeChange = (index: number, selectedTypes: string[]) => {
    const updatedCustomTypeSelections = [...customTypeSelections];
    updatedCustomTypeSelections[index] = selectedTypes.slice(0, 2); // Limit to the first two selected types
    if (selectedTypes.length === 0) {
      // If no custom types are selected, reinstate the Pokémon's original types
      const originalPokemonTypes = selectedPokemonList[index].types;
      updatedCustomTypeSelections[index] = originalPokemonTypes;
    }
    setCustomTypeSelections(updatedCustomTypeSelections);
  };





  return (
    <main className='p-2'>
      <div className="header-container">
        <img src="/icon.png" alt="Pokeball Logo" className="header-logo" />
        <h1 className='text-white text-3xl header'>Half Dozen</h1>
      </div>
      <div className="flex pokemonSelections">
        {[1, 2, 3, 4, 5, 6].map((index) => (
          <div key={index} className="mt-2 card">
            {renderCustomTypeSelections(index - 1)} {/* Render custom type selections */}
            <div>
              <input
                className="p-1 m-2 border"
                type="text"
                placeholder={`Select Pokemon ${index}...`}
                value={pokemonInputs[index - 1].value}
                onChange={(e) => handleInputChange(e, index - 1)}
                list={`pokemonOptions${index}`}
                onSelect={() => {
                  const syntheticEvent = {
                    target: {
                      value: pokemonInputs[index - 1].name,
                    },
                  };
                  handleInputChange(syntheticEvent as React.ChangeEvent<HTMLInputElement>, index - 1);
                }}
              />
              <datalist id={`pokemonOptions${index}`}>
                {pokemonList.map((pokemon, index) => (
                  <option key={index} value={pokemon.name} />
                ))}
              </datalist>



              {selectedPokemonList[index - 1] && (
                <>
                  <div className="pokemon-info">
                    <div className="pokemon-image">
                      {selectedPokemonList[index - 1].sprite && (
                        <img src={selectedPokemonList[index - 1].sprite} alt={`${selectedPokemonList[index - 1].name} sprite`} />
                      )}
                    </div>

                    <div className='pokemon-types'>
                      {(customTypeSelections[index - 1] ?? []).length > 0 ? (
                        // Render user-selected custom types
                        customTypeSelections[index - 1]?.map((type, typeIndex) => (
                          <span className='typeIcon'
                            key={typeIndex}
                            style={{
                              backgroundColor: typeColors[type],
                            }}
                          >
                            {type}
                          </span>
                        ))
                      ) : (
                        // Render original types of the Pokémon
                        selectedPokemonList[index - 1].types.map((type, typeIndex) => (
                          <span className='typeIcon'
                            key={typeIndex}
                            style={{
                              backgroundColor: typeColors[type],
                            }}
                          >
                            {type}
                          </span>
                        ))
                      )}
                    </div>


                  </div>
                  <div className="stats-bar-chart">
                    {selectedPokemonList[index - 1].stats.map((stat, statIndex) => (
                      <div key={statIndex} className="stat-bar">
                        <div className="stat-name">{statAbbreviations[stat.name as keyof typeof statAbbreviations]}</div>
                        <div className="stat-value" style={{
                          backgroundColor: getStatColor(stat.base_stat),
                          width: `${Math.min(Math.max(stat.base_stat / 4, 10), 100)}%` // Set a minimum width of 10% and a maximum width of 100%
                        }}>
                          {stat.base_stat}
                        </div>
                      </div>
                    ))}
                  </div>
                  {selectedPokemonList[index - 1].abilities.map((ability, abilityIndex) => {
                    // Convert ability name to capitalized with spaces instead of dashes
                    const formattedAbility = ability.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

                    // Check if the formatted ability is present in immunityAbilitiesMap
                    if (Object.keys(immunityAbilitiesMap).includes(ability)) {
                      return (
                        <div key={abilityIndex} className='text-white'>
                          <label>
                            <input
                              className='mr-2'
                              type="checkbox"
                              checked={selectedAbilities[index - 1] === ability} // Check if the ability is selected
                              onChange={() => handleAbilitySelectionToggle(ability, index - 1)} // Handle ability selection toggle
                            />
                            {formattedAbility}
                          </label>
                        </div>
                      );
                    }
                    return null; // If the ability is not in immunityAbilitiesMap, return null to skip rendering
                  })}
                </>
              )}


            </div>
          </div>
        ))}
      </div>

      <div>
        <div className="flex typeChartandStatsWrap">
          <div className="typeChartWrap">
            <h2 className='text-white text-xl mb-5 mt-5'>Type Effectiveness Chart</h2>
            <div className=''>
            <table className="text-white">
              <thead>
                <tr>
                  <th className="typeIcon">TYPE</th>
                  {selectedPokemonList.map((pokemon, index) => (
                    <th key={index} className={`typeChartSlot typeChartSlot${index + 1}`}>
                      {pokemon.sprite && <img src={pokemon.sprite} alt={`${pokemon.name} sprite`} />}
                    </th>
                  ))}
                  <th>Total Weak</th>
                  <th>Total Resist</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(typeEffectiveness).map((type, typeIndex) => (
                  <tr key={typeIndex}>
                    <td className={`typeIcon ${type}`}>{type}</td>
                    {combinedTypeChart.map((chart, index) => {
                      const value = chart[type];
                      let displayValue = '';
                      let cellClassName = '';
                      if (value !== undefined) {
                        if (value === 'IMMUNE') {
                          displayValue = 'IMMUNE';
                          cellClassName = 'immune-cell';
                        } else if (value === -2) {
                          displayValue = '1/4';
                          cellClassName = 'green-text';
                        } else if (value === -1) {
                          displayValue = '1/2';
                          cellClassName = 'green-text';
                        } else if (value === 1) {
                          displayValue = '2x';
                          cellClassName = 'red-text';
                        } else if (value === 2) {
                          displayValue = '4x';
                          cellClassName = 'red-text';
                        } else if (value === 0) {
                          displayValue = '';
                        }
                      }
                      return (
                        <td key={index} className={`typeChartSlot typeChartSlot${index + 1} ${cellClassName}`}>
                          {displayValue}
                        </td>
                      );
                    })}
                    <td className={`weaknesses-cell ${totalWeaknesses[type] ? 'text-white' : ''}`} style={{ backgroundColor: totalWeaknesses[type] ? `rgba(255, 0, 0, ${totalWeaknesses[type] / 6})` : '' }}>
                      {totalWeaknesses[type] || 0}
                    </td>
                    <td className={`resistances-cell ${totalResistances[type] ? 'text-white' : ''}`} style={{ backgroundColor: totalResistances[type] ? `rgba(0, 255, 0, ${totalResistances[type] / 6})` : '' }}>
                      {totalResistances[type] || 0}
                    </td>
                  </tr>
                ))}






              </tbody>

            </table>
            </div>
          </div>
          <div className='averageStats'>
            <TeamAverageStats selectedPokemonList={selectedPokemonList} />

          </div>
          <div className="load-save-wrap">
            <div className='save-wrap mb-5'><input type="text" value={teamName} onChange={handleTeamNameChange} placeholder="Enter team name" />
              <button onClick={handleSaveClick} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                Save Team
              </button></div>
            <div className='load-wrap'><select value={selectedTeam} onChange={handleTeamSelectChange}>
              <option value="">Select a saved team</option>
              {savedTeams.map((team, index) => (
                <option key={index} value={team}>{team}</option>
              ))}
            </select>
              <button onClick={handleLoadClick} className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
                Load Team
              </button>
            </div>
            {/* Checkbox to toggle visibility of custom type options */}
            <label className='text-white'>
              <input
                type="checkbox"
                checked={showCustomTypeOptions}
                onChange={toggleCustomTypeOptions}
              />
              &nbsp;Show Custom Type Options (WARNING: THIS WILL OVERWRITE EXISTING POKEMON TYPES)
            </label>


          </div>
        </div>



      </div>



      <footer>
        <p className='text-white text-center mt-10'>Made with ❤ (and ChatGPT) by Handyful. Big thanks to <a href="https://pokeapi.co/">PokeAPI</a> for the data, <a href="https://pokenode-ts.vercel.app/">Pokenode</a> for the data structure, and <a href="https://marriland.com/tools/team-builder/">Marriland</a> for the chart inspo.</p>
      </footer>

    </main>

  );
};

export default PokemonList;