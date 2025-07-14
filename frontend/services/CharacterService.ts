import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

export interface Character {
  id: string;
  userId: string;
  name: string;
  class: 'Treinador' | 'Pesquisador' | 'Vilão';
  origin: string;
  gender: 'Masculino' | 'Feminino';
  avatar?: string;
  starterPokemon: {
    id: number;
    name: string;
    imageUrl: string;
    level: number;
    gender: 'M' | 'F';
  };
  pokemonCount: number;
  badges: number;
  fame: number;
  lastPlayed: Date;
  createdAt: Date;
}

export class CharacterService {
  private static collection = firestore().collection('characters');

  static async getUserCharacters(): Promise<Character[]> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('Usuário não autenticado');
      }

      const snapshot = await this.collection
        .where('userId', '==', currentUser.uid)
        .orderBy('lastPlayed', 'desc')
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        lastPlayed: doc.data().lastPlayed?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Character[];
    } catch (error) {
      console.error('Erro ao buscar personagens:', error);
      throw error;
    }
  }

  static async createCharacter(characterData: Omit<Character, 'id' | 'userId' | 'createdAt' | 'lastPlayed'>): Promise<Character> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('Usuário não autenticado');
      }

      // Verificar limite de personagens para usuários não-VIP
      const userDoc = await firestore().collection('users').doc(currentUser.uid).get();
      const userData = userDoc.data();
      const isVip = userData?.isVip || false;

      const existingCharacters = await this.getUserCharacters();
      if (existingCharacters.length > 0 && !isVip) {
        throw new Error('Usuários gratuitos podem ter apenas 1 personagem');
      }

      const newCharacter = {
        ...characterData,
        userId: currentUser.uid,
        pokemonCount: 1, // Pokémon inicial
        badges: 0,
        fame: 0,
        createdAt: firestore.FieldValue.serverTimestamp(),
        lastPlayed: firestore.FieldValue.serverTimestamp(),
      };

      const docRef = await this.collection.add(newCharacter);
      
      return {
        id: docRef.id,
        ...characterData,
        userId: currentUser.uid,
        pokemonCount: 1,
        badges: 0,
        fame: 0,
        createdAt: new Date(),
        lastPlayed: new Date(),
      };
    } catch (error) {
      console.error('Erro ao criar personagem:', error);
      throw error;
    }
  }

  static async updateCharacter(characterId: string, updates: Partial<Character>): Promise<void> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('Usuário não autenticado');
      }

      // Verificar se o personagem pertence ao usuário
      const characterDoc = await this.collection.doc(characterId).get();
      if (!characterDoc.exists || characterDoc.data()?.userId !== currentUser.uid) {
        throw new Error('Personagem não encontrado ou não autorizado');
      }

      await this.collection.doc(characterId).update({
        ...updates,
        lastPlayed: firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error('Erro ao atualizar personagem:', error);
      throw error;
    }
  }

  static async deleteCharacter(characterId: string): Promise<void> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('Usuário não autenticado');
      }

      // Verificar se o personagem pertence ao usuário
      const characterDoc = await this.collection.doc(characterId).get();
      if (!characterDoc.exists || characterDoc.data()?.userId !== currentUser.uid) {
        throw new Error('Personagem não encontrado ou não autorizado');
      }

      await this.collection.doc(characterId).delete();
    } catch (error) {
      console.error('Erro ao deletar personagem:', error);
      throw error;
    }
  }

  static async getCharacterById(characterId: string): Promise<Character | null> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('Usuário não autenticado');
      }

      const doc = await this.collection.doc(characterId).get();
      
      if (!doc.exists || doc.data()?.userId !== currentUser.uid) {
        return null;
      }

      return {
        id: doc.id,
        ...doc.data(),
        lastPlayed: doc.data()?.lastPlayed?.toDate() || new Date(),
        createdAt: doc.data()?.createdAt?.toDate() || new Date(),
      } as Character;
    } catch (error) {
      console.error('Erro ao buscar personagem:', error);
      throw error;
    }
  }

  static async updateLastPlayed(characterId: string): Promise<void> {
    try {
      await this.collection.doc(characterId).update({
        lastPlayed: firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error('Erro ao atualizar último acesso:', error);
    }
  }
}

