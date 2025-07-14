// firebase-services.js
// Serviços Firebase para autenticação, dados e funcionalidades do jogo

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  updatePassword,
  deleteUser,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  onAuthStateChanged
} from 'firebase/auth';

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  writeBatch,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  onSnapshot
} from 'firebase/firestore';

import {
  ref,
  set,
  update,
  remove,
  push,
  onValue,
  off,
  serverTimestamp as rtdbServerTimestamp,
  onDisconnect
} from 'firebase/database';

import { auth, firestore, realtimeDb } from './firebase-config';
import { UserModel, CharacterModel, CapturedPokemonModel, BattleModel, COLLECTIONS } from './firestore-models';
import pokemonAPIService from './pokemon-api-service';

// ================================
// SERVIÇO DE AUTENTICAÇÃO
// ================================

class AuthService {
  constructor() {
    this.currentUser = null;
    this.authStateListeners = [];
    this.setupAuthStateListener();
  }

  setupAuthStateListener() {
    onAuthStateChanged(auth, (user) => {
      this.currentUser = user;
      this.authStateListeners.forEach(listener => listener(user));
      
      if (user) {
        this.updateUserPresence(user.uid, true);
        this.setupDisconnectHandler(user.uid);
      }
    });
  }

  onAuthStateChanged(callback) {
    this.authStateListeners.push(callback);
    // Retornar função para remover listener
    return () => {
      const index = this.authStateListeners.indexOf(callback);
      if (index > -1) {
        this.authStateListeners.splice(index, 1);
      }
    };
  }

  async signUp(email, password, displayName, additionalData = {}) {
    try {
      // Criar usuário no Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Atualizar perfil
      await updateProfile(user, { displayName });

      // Criar documento do usuário no Firestore
      await UserModel.create({
        uid: user.uid,
        email: user.email,
        displayName: displayName,
        photoURL: user.photoURL,
        ...additionalData
      });

      // Configurar presença
      await this.updateUserPresence(user.uid, true);

      return {
        user: {
          uid: user.uid,
          email: user.email,
          displayName: displayName,
          photoURL: user.photoURL
        },
        isNewUser: true
      };
    } catch (error) {
      console.error('Erro no registro:', error);
      throw this.handleAuthError(error);
    }
  }

  async signIn(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Atualizar último login
      await UserModel.update(user.uid, {
        lastLoginAt: serverTimestamp()
      });

      // Configurar presença
      await this.updateUserPresence(user.uid, true);

      return {
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL
        }
      };
    } catch (error) {
      console.error('Erro no login:', error);
      throw this.handleAuthError(error);
    }
  }

  async signInWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');

      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Verificar se é novo usuário
      const existingUser = await UserModel.getById(user.uid);
      const isNewUser = !existingUser;

      if (isNewUser) {
        // Criar documento do usuário
        await UserModel.create({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL
        });
      } else {
        // Atualizar último login
        await UserModel.update(user.uid, {
          lastLoginAt: serverTimestamp()
        });
      }

      await this.updateUserPresence(user.uid, true);

      return {
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL
        },
        isNewUser
      };
    } catch (error) {
      console.error('Erro no login com Google:', error);
      throw this.handleAuthError(error);
    }
  }

  async signOut() {
    try {
      if (this.currentUser) {
        await this.updateUserPresence(this.currentUser.uid, false);
      }
      await signOut(auth);
    } catch (error) {
      console.error('Erro no logout:', error);
      throw error;
    }
  }

  async resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Erro ao enviar email de recuperação:', error);
      throw this.handleAuthError(error);
    }
  }

  async updateUserProfile(updates) {
    try {
      if (!this.currentUser) throw new Error('Usuário não autenticado');

      // Atualizar no Firebase Auth
      if (updates.displayName || updates.photoURL) {
        await updateProfile(this.currentUser, {
          displayName: updates.displayName,
          photoURL: updates.photoURL
        });
      }

      // Atualizar no Firestore
      await UserModel.update(this.currentUser.uid, updates);

      return true;
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      throw error;
    }
  }

  async updateUserPresence(userId, isOnline) {
    try {
      const presenceRef = ref(realtimeDb, `presence/${userId}`);
      await set(presenceRef, {
        online: isOnline,
        lastSeen: rtdbServerTimestamp()
      });
    } catch (error) {
      console.warn('Erro ao atualizar presença:', error);
    }
  }

  setupDisconnectHandler(userId) {
    const presenceRef = ref(realtimeDb, `presence/${userId}`);
    onDisconnect(presenceRef).set({
      online: false,
      lastSeen: rtdbServerTimestamp()
    });
  }

  handleAuthError(error) {
    const errorMessages = {
      'auth/user-not-found': 'Usuário não encontrado',
      'auth/wrong-password': 'Senha incorreta',
      'auth/email-already-in-use': 'Email já está em uso',
      'auth/weak-password': 'Senha muito fraca',
      'auth/invalid-email': 'Email inválido',
      'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde',
      'auth/network-request-failed': 'Erro de conexão. Verifique sua internet'
    };

    return new Error(errorMessages[error.code] || error.message);
  }
}

// ================================
// SERVIÇO DE PERSONAGENS
// ================================

class CharacterService {
  async createCharacter(characterData) {
    try {
      // Verificar se usuário pode criar personagem
      const user = await UserModel.getById(characterData.userId);
      if (!user) throw new Error('Usuário não encontrado');

      // Verificar limite de personagens
      const existingCharacters = await CharacterModel.getUserCharacters(characterData.userId);
      if (!user.isVip && existingCharacters.length >= 1) {
        throw new Error('Usuários gratuitos podem ter apenas 1 personagem. Upgrade para VIP para criar mais.');
      }

      // Criar personagem
      const character = await CharacterModel.create(characterData);

      // Capturar Pokémon inicial
      if (characterData.starterPokemonId) {
        await this.captureStarterPokemon(character.id, characterData);
      }

      // Atualizar estatísticas do usuário
      await UserModel.updateStats(characterData.userId, {
        totalCharacters: 1
      });

      return character;
    } catch (error) {
      console.error('Erro ao criar personagem:', error);
      throw error;
    }
  }

  async captureStarterPokemon(characterId, characterData) {
    try {
      const pokemonData = await pokemonAPIService.getPokemon(characterData.starterPokemonId);
      
      const capturedPokemon = await CapturedPokemonModel.create({
        characterId: characterId,
        pokemonId: characterData.starterPokemonId,
        nickname: null,
        level: 5,
        experience: 0,
        isShiny: false,
        gender: characterData.starterPokemonGender || (Math.random() > 0.5 ? 'M' : 'F'),
        nature: pokemonAPIService.getRandomNature(),
        ability: pokemonData.abilityNames[0],
        hiddenAbility: false,
        originalTrainer: characterData.name,
        trainerId: characterId,
        friendship: 70,
        ivs: pokemonAPIService.generateRandomIVs(),
        evs: { hp: 0, attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 },
        teamPosition: 1,
        caughtLocation: characterData.origin,
        pokeball: 'pokeball',
        moves: pokemonData.levelUpMoves.slice(0, 4)
      });

      // Adicionar à equipe do personagem
      await CharacterModel.addToTeam(characterId, capturedPokemon.id);

      return capturedPokemon;
    } catch (error) {
      console.error('Erro ao capturar Pokémon inicial:', error);
      throw error;
    }
  }

  async getCharacterDetails(characterId) {
    try {
      const character = await CharacterModel.getById(characterId);
      if (!character) throw new Error('Personagem não encontrado');

      // Buscar Pokémon da equipe
      const teamPokemon = await CapturedPokemonModel.getCharacterPokemon(characterId, true);
      
      // Enriquecer com dados da PokeAPI
      const enrichedTeam = await Promise.all(
        teamPokemon.map(async (pokemon) => {
          const apiData = await pokemonAPIService.getPokemon(pokemon.pokemonId);
          return {
            ...pokemon,
            apiData
          };
        })
      );

      return {
        ...character,
        team: enrichedTeam
      };
    } catch (error) {
      console.error('Erro ao buscar detalhes do personagem:', error);
      throw error;
    }
  }

  async updateCharacterStats(characterId, statsUpdate) {
    try {
      const updateObject = {};
      Object.keys(statsUpdate).forEach(key => {
        updateObject[`stats.${key}`] = increment(statsUpdate[key]);
      });

      await CharacterModel.update(characterId, {
        ...updateObject,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Erro ao atualizar estatísticas do personagem:', error);
      throw error;
    }
  }
}

// ================================
// SERVIÇO DE CAPTURA
// ================================

class CaptureService {
  async generateWildPokemon(location, characterLevel) {
    try {
      // Determinar Pokémon disponíveis na localização
      const availablePokemon = this.getPokemonByLocation(location);
      const randomPokemonId = availablePokemon[Math.floor(Math.random() * availablePokemon.length)];
      
      // Buscar dados do Pokémon
      const pokemonData = await pokemonAPIService.getPokemon(randomPokemonId);
      
      // Calcular nível baseado no nível do personagem
      const level = this.calculateWildLevel(characterLevel);
      
      // Determinar se é shiny (1/4096 chance)
      const isShiny = Math.random() < (1 / 4096);
      
      return {
        ...pokemonData,
        level,
        isShiny,
        gender: this.generateGender(pokemonData),
        nature: pokemonAPIService.getRandomNature(),
        ability: this.selectRandomAbility(pokemonData),
        ivs: pokemonAPIService.generateRandomIVs()
      };
    } catch (error) {
      console.error('Erro ao gerar Pokémon selvagem:', error);
      throw error;
    }
  }

  async attemptCapture(characterId, wildPokemon, pokeball = 'pokeball') {
    try {
      // Calcular taxa de captura
      const captureRate = this.calculateCaptureRate(wildPokemon, pokeball);
      const success = Math.random() < captureRate;

      if (success) {
        // Capturar Pokémon
        const capturedPokemon = await CapturedPokemonModel.create({
          characterId,
          pokemonId: wildPokemon.id,
          level: wildPokemon.level,
          isShiny: wildPokemon.isShiny,
          gender: wildPokemon.gender,
          nature: wildPokemon.nature,
          ability: wildPokemon.ability,
          ivs: wildPokemon.ivs,
          evs: { hp: 0, attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 },
          caughtLocation: 'Wild Area', // TODO: usar localização real
          pokeball,
          moves: wildPokemon.levelUpMoves.slice(0, 4)
        });

        // Atualizar estatísticas do personagem
        await CharacterService.prototype.updateCharacterStats(characterId, {
          pokemonCaught: 1,
          ...(wildPokemon.isShiny && { shinyFound: 1 })
        });

        // Consumir Pokéball do inventário
        await CharacterModel.updateInventory(characterId, {
          pokeballs: { [pokeball]: -1 }
        });

        return {
          success: true,
          pokemon: capturedPokemon
        };
      } else {
        // Falha na captura, apenas consumir Pokéball
        await CharacterModel.updateInventory(characterId, {
          pokeballs: { [pokeball]: -1 }
        });

        return {
          success: false,
          pokemon: null
        };
      }
    } catch (error) {
      console.error('Erro na tentativa de captura:', error);
      throw error;
    }
  }

  calculateCaptureRate(pokemon, pokeball) {
    // Taxa base do Pokémon (simulada)
    const baseCaptureRate = 45; // Valor médio
    
    // Multiplicadores das Pokéballs
    const pokeballMultipliers = {
      'pokeball': 1,
      'greatball': 1.5,
      'ultraball': 2,
      'masterball': 255 // Captura garantida
    };

    const multiplier = pokeballMultipliers[pokeball] || 1;
    
    // Fórmula simplificada de captura
    const captureValue = ((3 * pokemon.statsTotal - 2 * pokemon.currentHp) * baseCaptureRate * multiplier) / (3 * pokemon.statsTotal);
    
    return Math.min(captureValue / 255, 1); // Máximo 100%
  }

  calculateWildLevel(characterLevel) {
    const minLevel = Math.max(1, characterLevel - 5);
    const maxLevel = characterLevel + 5;
    return Math.floor(Math.random() * (maxLevel - minLevel + 1)) + minLevel;
  }

  generateGender(pokemonData) {
    // Simplificado - 50/50 para a maioria dos Pokémon
    // TODO: Implementar taxa de gênero real da PokeAPI
    return Math.random() > 0.5 ? 'M' : 'F';
  }

  selectRandomAbility(pokemonData) {
    const abilities = pokemonData.abilityNames;
    return abilities[Math.floor(Math.random() * abilities.length)];
  }

  getPokemonByLocation(location) {
    // Mapeamento simplificado de localização para Pokémon
    const locationMap = {
      'Pallet Town': [1, 4, 7, 16, 19, 25],
      'Route 1': [16, 19, 10, 13],
      'Viridian Forest': [10, 11, 13, 14, 25],
      'Mt. Moon': [41, 42, 74, 75],
      'Rock Tunnel': [66, 67, 95, 104],
      'Safari Zone': [29, 30, 32, 33, 111, 113, 115, 123, 127, 128],
      'Seafoam Islands': [86, 87, 116, 117, 120, 121],
      'Victory Road': [42, 57, 95, 105, 112]
    };

    return locationMap[location] || [1, 4, 7]; // Padrão: starters de Kanto
  }
}

// ================================
// SERVIÇO DE BATALHAS
// ================================

class BattleService {
  async createBattle(player1Data, battleType = 'pvp', rules = {}) {
    try {
      const battle = await BattleModel.create({
        type: battleType,
        status: 'waiting',
        player1: player1Data,
        rules: {
          maxLevel: 100,
          itemsAllowed: true,
          legendariesAllowed: false,
          timeLimit: 300,
          maxTeamSize: 6,
          ...rules
        }
      });

      // Adicionar à fila de matchmaking se for PvP
      if (battleType === 'pvp') {
        await this.addToMatchmaking(player1Data.userId, battle.id);
      }

      return battle;
    } catch (error) {
      console.error('Erro ao criar batalha:', error);
      throw error;
    }
  }

  async joinBattle(battleId, player2Data) {
    try {
      await BattleModel.update(battleId, {
        player2: player2Data,
        status: 'active',
        startedAt: serverTimestamp()
      });

      // Remover da fila de matchmaking
      await this.removeFromMatchmaking(player2Data.userId);

      return true;
    } catch (error) {
      console.error('Erro ao entrar na batalha:', error);
      throw error;
    }
  }

  async addToMatchmaking(userId, battleId) {
    try {
      const matchmakingRef = ref(realtimeDb, `matchmaking/${userId}`);
      await set(matchmakingRef, {
        battleId,
        timestamp: rtdbServerTimestamp()
      });
    } catch (error) {
      console.warn('Erro ao adicionar ao matchmaking:', error);
    }
  }

  async removeFromMatchmaking(userId) {
    try {
      const matchmakingRef = ref(realtimeDb, `matchmaking/${userId}`);
      await remove(matchmakingRef);
    } catch (error) {
      console.warn('Erro ao remover do matchmaking:', error);
    }
  }

  listenToBattle(battleId, callback) {
    const battleRef = ref(realtimeDb, `battles/${battleId}`);
    onValue(battleRef, callback);
    
    // Retornar função para parar de escutar
    return () => off(battleRef, 'value', callback);
  }
}

// ================================
// SERVIÇO DE AMIZADES E CHAT
// ================================

class SocialService {
  async sendFriendRequest(fromUserId, toUserId) {
    try {
      // Verificar se já existe amizade
      const existingFriendship = await this.getFriendship(fromUserId, toUserId);
      if (existingFriendship) {
        throw new Error('Solicitação de amizade já existe');
      }

      const friendship = await addDoc(collection(firestore, COLLECTIONS.FRIENDSHIPS), {
        userId1: fromUserId,
        userId2: toUserId,
        status: 'pending',
        requestedBy: fromUserId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Enviar notificação em tempo real
      await this.sendNotification(toUserId, {
        type: 'friend_request',
        fromUserId,
        friendshipId: friendship.id
      });

      return friendship;
    } catch (error) {
      console.error('Erro ao enviar solicitação de amizade:', error);
      throw error;
    }
  }

  async respondToFriendRequest(friendshipId, response) {
    try {
      await updateDoc(doc(firestore, COLLECTIONS.FRIENDSHIPS, friendshipId), {
        status: response, // 'accepted' ou 'rejected'
        updatedAt: serverTimestamp()
      });

      return true;
    } catch (error) {
      console.error('Erro ao responder solicitação de amizade:', error);
      throw error;
    }
  }

  async getFriendship(userId1, userId2) {
    try {
      const q1 = query(
        collection(firestore, COLLECTIONS.FRIENDSHIPS),
        where('userId1', '==', userId1),
        where('userId2', '==', userId2)
      );

      const q2 = query(
        collection(firestore, COLLECTIONS.FRIENDSHIPS),
        where('userId1', '==', userId2),
        where('userId2', '==', userId1)
      );

      const [snapshot1, snapshot2] = await Promise.all([getDocs(q1), getDocs(q2)]);
      
      if (!snapshot1.empty) {
        return { id: snapshot1.docs[0].id, ...snapshot1.docs[0].data() };
      }
      
      if (!snapshot2.empty) {
        return { id: snapshot2.docs[0].id, ...snapshot2.docs[0].data() };
      }

      return null;
    } catch (error) {
      console.error('Erro ao buscar amizade:', error);
      return null;
    }
  }

  async sendNotification(userId, notification) {
    try {
      const notificationRef = ref(realtimeDb, `notifications/${userId}/${Date.now()}`);
      await set(notificationRef, {
        ...notification,
        timestamp: rtdbServerTimestamp(),
        read: false
      });
    } catch (error) {
      console.warn('Erro ao enviar notificação:', error);
    }
  }
}

// ================================
// EXPORTAR SERVIÇOS
// ================================

const authService = new AuthService();
const characterService = new CharacterService();
const captureService = new CaptureService();
const battleService = new BattleService();
const socialService = new SocialService();

export {
  authService,
  characterService,
  captureService,
  battleService,
  socialService,
  AuthService,
  CharacterService,
  CaptureService,
  BattleService,
  SocialService
};

export default {
  auth: authService,
  character: characterService,
  capture: captureService,
  battle: battleService,
  social: socialService
};

