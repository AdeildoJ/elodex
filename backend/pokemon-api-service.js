// pokemon-api-service.js
// Serviço para integração com PokeAPI - Otimizado para performance e cache

import AsyncStorage from '@react-native-async-storage/async-storage';


class PokemonAPIService {
  constructor() {
    this.baseUrl = 'https://pokeapi.co/api/v2';
    this.cache = new Map();
    this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 horas
    this.requestQueue = new Map();
    this.maxConcurrentRequests = 10;
    this.currentRequests = 0;
  }

  // ================================
  // MÉTODOS DE CACHE
  // ================================

  async getCacheKey(endpoint) {
    return `pokemon_cache_${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}`;
  }

  async getFromCache(endpoint) {
    try {
      const cacheKey = await this.getCacheKey(endpoint);
      
      // Verificar cache em memória primeiro
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheExpiry) {
          return cached.data;
        }
        this.cache.delete(cacheKey);
      }

      // Verificar cache persistente
      const cachedString = await AsyncStorage.getItem(cacheKey);
      if (cachedString) {
        const cached = JSON.parse(cachedString);
        if (Date.now() - cached.timestamp < this.cacheExpiry) {
          // Adicionar ao cache em memória
          this.cache.set(cacheKey, cached);
          return cached.data;
        }
        // Cache expirado, remover
        await AsyncStorage.removeItem(cacheKey);
      }
    } catch (error) {
      console.warn('Erro ao acessar cache:', error);
    }
    return null;
  }

  async saveToCache(endpoint, data) {
    try {
      const cacheKey = await this.getCacheKey(endpoint);
      const cacheData = {
        data,
        timestamp: Date.now()
      };

      // Salvar em memória
      this.cache.set(cacheKey, cacheData);

      // Salvar persistente
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Erro ao salvar cache:', error);
    }
  }

  async clearCache() {
    try {
      this.cache.clear();
      const keys = await AsyncStorage.getAllKeys();
      const pokemonKeys = keys.filter(key => key.startsWith('pokemon_cache_'));
      await AsyncStorage.multiRemove(pokemonKeys);
    } catch (error) {
      console.warn('Erro ao limpar cache:', error);
    }
  }

  // ================================
  // MÉTODOS DE REQUISIÇÃO
  // ================================

  async makeRequest(endpoint) {
    // Verificar cache primeiro
    const cached = await this.getFromCache(endpoint);
    if (cached) {
      return cached;
    }

    // Verificar se já existe uma requisição em andamento para este endpoint
    if (this.requestQueue.has(endpoint)) {
      return this.requestQueue.get(endpoint);
    }

    // Controle de concorrência
    while (this.currentRequests >= this.maxConcurrentRequests) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const requestPromise = this.executeRequest(endpoint);
    this.requestQueue.set(endpoint, requestPromise);

    try {
      const result = await requestPromise;
      await this.saveToCache(endpoint, result);
      return result;
    } finally {
      this.requestQueue.delete(endpoint);
    }
  }

  async executeRequest(endpoint) {
    this.currentRequests++;
    
    try {
      const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}/${endpoint}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'PokemonApp/1.0'
        },
        timeout: 10000 // 10 segundos
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } finally {
      this.currentRequests--;
    }
  }

  // ================================
  // MÉTODOS PRINCIPAIS DA API
  // ================================

  async getPokemon(idOrName) {
    try {
      const endpoint = `pokemon/${idOrName.toString().toLowerCase()}`;
      const pokemon = await this.makeRequest(endpoint);
      
      // Enriquecer dados com informações calculadas
      return this.enrichPokemonData(pokemon);
    } catch (error) {
      console.error(`Erro ao buscar Pokémon ${idOrName}:`, error);
      throw new Error(`Não foi possível carregar dados do Pokémon ${idOrName}`);
    }
  }

  async getPokemonSpecies(idOrName) {
    try {
      const endpoint = `pokemon-species/${idOrName.toString().toLowerCase()}`;
      return await this.makeRequest(endpoint);
    } catch (error) {
      console.error(`Erro ao buscar espécie ${idOrName}:`, error);
      throw new Error(`Não foi possível carregar dados da espécie ${idOrName}`);
    }
  }

  async getPokemonEvolutionChain(id) {
    try {
      const species = await this.getPokemonSpecies(id);
      const evolutionUrl = species.evolution_chain.url;
      const evolutionId = evolutionUrl.split('/').slice(-2, -1)[0];
      
      const endpoint = `evolution-chain/${evolutionId}`;
      return await this.makeRequest(endpoint);
    } catch (error) {
      console.error(`Erro ao buscar cadeia evolutiva ${id}:`, error);
      return null;
    }
  }

  async getMove(idOrName) {
    try {
      const endpoint = `move/${idOrName.toString().toLowerCase()}`;
      return await this.makeRequest(endpoint);
    } catch (error) {
      console.error(`Erro ao buscar movimento ${idOrName}:`, error);
      throw new Error(`Não foi possível carregar dados do movimento ${idOrName}`);
    }
  }

  async getAbility(idOrName) {
    try {
      const endpoint = `ability/${idOrName.toString().toLowerCase()}`;
      return await this.makeRequest(endpoint);
    } catch (error) {
      console.error(`Erro ao buscar habilidade ${idOrName}:`, error);
      throw new Error(`Não foi possível carregar dados da habilidade ${idOrName}`);
    }
  }

  async getType(idOrName) {
    try {
      const endpoint = `type/${idOrName.toString().toLowerCase()}`;
      return await this.makeRequest(endpoint);
    } catch (error) {
      console.error(`Erro ao buscar tipo ${idOrName}:`, error);
      throw new Error(`Não foi possível carregar dados do tipo ${idOrName}`);
    }
  }

  async getItem(idOrName) {
    try {
      const endpoint = `item/${idOrName.toString().toLowerCase()}`;
      return await this.makeRequest(endpoint);
    } catch (error) {
      console.error(`Erro ao buscar item ${idOrName}:`, error);
      throw new Error(`Não foi possível carregar dados do item ${idOrName}`);
    }
  }

  async getLocation(idOrName) {
    try {
      const endpoint = `location/${idOrName.toString().toLowerCase()}`;
      return await this.makeRequest(endpoint);
    } catch (error) {
      console.error(`Erro ao buscar localização ${idOrName}:`, error);
      throw new Error(`Não foi possível carregar dados da localização ${idOrName}`);
    }
  }

  // ================================
  // MÉTODOS DE BUSCA EM LOTE
  // ================================

  async getPokemonBatch(ids) {
    try {
      const promises = ids.map(id => this.getPokemon(id));
      const results = await Promise.allSettled(promises);
      
      return results.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          console.warn(`Erro ao carregar Pokémon ${ids[index]}:`, result.reason);
          return null;
        }
      }).filter(Boolean);
    } catch (error) {
      console.error('Erro ao carregar lote de Pokémon:', error);
      return [];
    }
  }

  async getStarterPokemon(region, pokemonClass) {
    const starters = this.getStarterIds(region, pokemonClass);
    return await this.getPokemonBatch(starters);
  }

  // ================================
  // MÉTODOS UTILITÁRIOS
  // ================================

  getStarterIds(region, pokemonClass) {
    const starterMap = {
      'Kanto': {
        'Treinador': [1, 4, 7], // Bulbasaur, Charmander, Squirtle
        'Pesquisador': [25, 133, 104], // Pikachu, Eevee, Cubone
        'Vilão': [19, 41, 52] // Rattata, Zubat, Meowth
      },
      'Johto': {
        'Treinador': [152, 155, 158], // Chikorita, Cyndaquil, Totodile
        'Pesquisador': [179, 220, 231], // Mareep, Swinub, Phanpy
        'Vilão': [198, 215, 228] // Murkrow, Sneasel, Houndour
      },
      'Hoenn': {
        'Treinador': [252, 255, 258], // Treecko, Torchic, Mudkip
        'Pesquisador': [280, 287, 300], // Ralts, Slakoth, Skitty
        'Vilão': [261, 302, 318] // Poochyena, Sableye, Carvanha
      },
      'Sinnoh': {
        'Treinador': [387, 390, 393], // Turtwig, Chimchar, Piplup
        'Pesquisador': [403, 427, 449], // Shinx, Buneary, Hippopotas
        'Vilão': [434, 453, 455] // Stunky, Croagunk, Carnivine
      },
      'Unova': {
        'Treinador': [495, 498, 501], // Snivy, Tepig, Oshawott
        'Pesquisador': [504, 506, 509], // Patrat, Lillipup, Purrloin
        'Vilão': [551, 559, 570] // Sandile, Scraggy, Zorua
      },
      'Kalos': {
        'Treinador': [650, 653, 656], // Chespin, Fennekin, Froakie
        'Pesquisador': [659, 667, 674], // Bunnelby, Litleo, Pancham
        'Vilão': [686, 692, 701] // Inkay, Clauncher, Hawlucha
      },
      'Alola': {
        'Treinador': [722, 725, 728], // Rowlet, Litten, Popplio
        'Pesquisador': [734, 742, 746], // Yungoos, Cutiefly, Wishiwashi
        'Vilão': [757, 765, 771] // Salandit, Oranguru, Pyukumuku
      },
      'Galar': {
        'Treinador': [810, 813, 816], // Grookey, Scorbunny, Sobble
        'Pesquisador': [819, 821, 831], // Skwovet, Rookidee, Wooloo
        'Vilão': [859, 870, 885] // Impidimp, Falinks, Dreepy
      }
    };

    return starterMap[region]?.[pokemonClass] || starterMap['Kanto']['Treinador'];
  }

  enrichPokemonData(pokemon) {
    return {
      ...pokemon,
      // Adicionar URL da imagem de alta qualidade
      highQualityImage: pokemon.sprites?.other?.['official-artwork']?.front_default || 
                       pokemon.sprites?.front_default,
      
      // Adicionar informações de tipos formatadas
      typeNames: pokemon.types?.map(type => type.type.name) || [],
      
      // Adicionar habilidades formatadas
      abilityNames: pokemon.abilities?.map(ability => ability.ability.name) || [],
      
      // Adicionar stats formatados
      statsFormatted: pokemon.stats?.reduce((acc, stat) => {
        acc[stat.stat.name.replace('-', '_')] = stat.base_stat;
        return acc;
      }, {}) || {},
      
      // Adicionar total de stats
      statsTotal: pokemon.stats?.reduce((total, stat) => total + stat.base_stat, 0) || 0,
      
      // Adicionar movimentos de nível inicial
      levelUpMoves: pokemon.moves?.filter(move => 
        move.version_group_details.some(detail => 
          detail.move_learn_method.name === 'level-up' && detail.level_learned_at <= 10
        )
      ).map(move => move.move.name) || []
    };
  }

  // ================================
  // MÉTODOS DE BUSCA E FILTRO
  // ================================

  async searchPokemon(query, limit = 20) {
    try {
      // Para busca simples, usar lista de Pokémon
      const pokemonList = await this.makeRequest('pokemon?limit=1010');
      
      const filtered = pokemonList.results
        .filter(pokemon => 
          pokemon.name.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, limit);

      // Carregar dados completos dos Pokémon encontrados
      const pokemonData = await Promise.all(
        filtered.map(pokemon => this.getPokemon(pokemon.name))
      );

      return pokemonData;
    } catch (error) {
      console.error('Erro na busca de Pokémon:', error);
      return [];
    }
  }

  async getPokemonByType(typeName, limit = 50) {
    try {
      const typeData = await this.getType(typeName);
      const pokemonList = typeData.pokemon
        .slice(0, limit)
        .map(entry => entry.pokemon);

      const pokemonData = await this.getPokemonBatch(
        pokemonList.map(pokemon => pokemon.name)
      );

      return pokemonData;
    } catch (error) {
      console.error(`Erro ao buscar Pokémon do tipo ${typeName}:`, error);
      return [];
    }
  }

  async getPokemonByGeneration(generation) {
    try {
      const generationData = await this.makeRequest(`generation/${generation}`);
      const pokemonList = generationData.pokemon_species.map(species => species.name);

      const pokemonData = await this.getPokemonBatch(pokemonList);
      return pokemonData;
    } catch (error) {
      console.error(`Erro ao buscar Pokémon da geração ${generation}:`, error);
      return [];
    }
  }

  // ================================
  // MÉTODOS DE CÁLCULO
  // ================================

  calculateStats(pokemon, level, ivs, evs, nature = 'hardy') {
    const baseStats = pokemon.statsFormatted;
    const natureModifiers = this.getNatureModifiers(nature);
    
    const stats = {};
    
    // HP é calculado diferente
    stats.hp = Math.floor(
      ((2 * baseStats.hp + ivs.hp + Math.floor(evs.hp / 4)) * level / 100) + level + 10
    );
    
    // Outras stats
    ['attack', 'defense', 'special_attack', 'special_defense', 'speed'].forEach(stat => {
      const baseStat = baseStats[stat] || 0;
      const iv = ivs[stat] || 0;
      const ev = evs[stat] || 0;
      const natureMultiplier = natureModifiers[stat] || 1;
      
      stats[stat] = Math.floor(
        (((2 * baseStat + iv + Math.floor(ev / 4)) * level / 100) + 5) * natureMultiplier
      );
    });
    
    return stats;
  }

  getNatureModifiers(nature) {
    const natures = {
      'hardy': {},
      'lonely': { attack: 1.1, defense: 0.9 },
      'brave': { attack: 1.1, speed: 0.9 },
      'adamant': { attack: 1.1, special_attack: 0.9 },
      'naughty': { attack: 1.1, special_defense: 0.9 },
      'bold': { defense: 1.1, attack: 0.9 },
      'docile': {},
      'relaxed': { defense: 1.1, speed: 0.9 },
      'impish': { defense: 1.1, special_attack: 0.9 },
      'lax': { defense: 1.1, special_defense: 0.9 },
      'timid': { speed: 1.1, attack: 0.9 },
      'hasty': { speed: 1.1, defense: 0.9 },
      'serious': {},
      'jolly': { speed: 1.1, special_attack: 0.9 },
      'naive': { speed: 1.1, special_defense: 0.9 },
      'modest': { special_attack: 1.1, attack: 0.9 },
      'mild': { special_attack: 1.1, defense: 0.9 },
      'quiet': { special_attack: 1.1, speed: 0.9 },
      'bashful': {},
      'rash': { special_attack: 1.1, special_defense: 0.9 },
      'calm': { special_defense: 1.1, attack: 0.9 },
      'gentle': { special_defense: 1.1, defense: 0.9 },
      'sassy': { special_defense: 1.1, speed: 0.9 },
      'careful': { special_defense: 1.1, special_attack: 0.9 },
      'quirky': {}
    };
    
    return natures[nature.toLowerCase()] || {};
  }

  generateRandomIVs() {
    return {
      hp: Math.floor(Math.random() * 32),
      attack: Math.floor(Math.random() * 32),
      defense: Math.floor(Math.random() * 32),
      special_attack: Math.floor(Math.random() * 32),
      special_defense: Math.floor(Math.random() * 32),
      speed: Math.floor(Math.random() * 32)
    };
  }

  getRandomNature() {
    const natures = [
      'hardy', 'lonely', 'brave', 'adamant', 'naughty',
      'bold', 'docile', 'relaxed', 'impish', 'lax',
      'timid', 'hasty', 'serious', 'jolly', 'naive',
      'modest', 'mild', 'quiet', 'bashful', 'rash',
      'calm', 'gentle', 'sassy', 'careful', 'quirky'
    ];
    
    return natures[Math.floor(Math.random() * natures.length)];
  }
}

// Instância singleton
const pokemonAPIService = new PokemonAPIService();

export default pokemonAPIService;
export { PokemonAPIService };

