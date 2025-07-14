import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Character {
  id: string;
  name: string;
  class: 'Treinador' | 'Pesquisador' | 'Vilão';
  origin: string;
  gender: 'Masculino' | 'Feminino';
  starterPokemonId: number;
  starterPokemonName: string;
  starterPokemonGender: 'Masculino' | 'Feminino';
  starterIsShiny: boolean;
  level: number;
  experience: number;
  avatar?: string;
  createdAt: string;
}

class CharacterService {
  private storageKey = '@EloDex:characters';

  async getCharacters(userId: string): Promise<Character[]> {
    try {
      const charactersData = await AsyncStorage.getItem(`${this.storageKey}:${userId}`);
      return charactersData ? JSON.parse(charactersData) : [];
    } catch (error) {
      console.error('Erro ao buscar personagens:', error);
      return [];
    }
  }

  async createCharacter(userId: string, characterData: Omit<Character, 'id' | 'level' | 'experience' | 'createdAt'>): Promise<Character> {
    try {
      const characters = await this.getCharacters(userId);
      
      const newCharacter: Character = {
        ...characterData,
        id: Date.now().toString(),
        level: 1,
        experience: 0,
        createdAt: new Date().toISOString(),
      };

      characters.push(newCharacter);
      await AsyncStorage.setItem(`${this.storageKey}:${userId}`, JSON.stringify(characters));
      
      return newCharacter;
    } catch (error) {
      console.error('Erro ao criar personagem:', error);
      throw error;
    }
  }

  async updateCharacter(userId: string, characterId: string, updates: Partial<Character>): Promise<Character | null> {
    try {
      const characters = await this.getCharacters(userId);
      const characterIndex = characters.findIndex(char => char.id === characterId);
      
      if (characterIndex === -1) {
        return null;
      }

      characters[characterIndex] = { ...characters[characterIndex], ...updates };
      await AsyncStorage.setItem(`${this.storageKey}:${userId}`, JSON.stringify(characters));
      
      return characters[characterIndex];
    } catch (error) {
      console.error('Erro ao atualizar personagem:', error);
      throw error;
    }
  }

  async deleteCharacter(userId: string, characterId: string): Promise<boolean> {
    try {
      const characters = await this.getCharacters(userId);
      const filteredCharacters = characters.filter(char => char.id !== characterId);
      
      await AsyncStorage.setItem(`${this.storageKey}:${userId}`, JSON.stringify(filteredCharacters));
      return true;
    } catch (error) {
      console.error('Erro ao deletar personagem:', error);
      return false;
    }
  }

  async getCharacterById(userId: string, characterId: string): Promise<Character | null> {
    try {
      const characters = await this.getCharacters(userId);
      return characters.find(char => char.id === characterId) || null;
    } catch (error) {
      console.error('Erro ao buscar personagem:', error);
      return null;
    }
  }
}

export const characterService = new CharacterService();

