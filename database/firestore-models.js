// firestore-models.js
// Modelos de dados para Firestore - Estrutura otimizada para 100k+ usuários

import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
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
  arrayRemove
} from 'firebase/firestore';
import { firestore } from './firebase-config';

// ================================
// COLEÇÕES PRINCIPAIS
// ================================

export const COLLECTIONS = {
  USERS: 'users',
  CHARACTERS: 'characters',
  CAPTURED_POKEMON: 'captured_pokemon',
  BATTLES: 'battles',
  BATTLE_HISTORY: 'battle_history',
  FRIENDSHIPS: 'friendships',
  CHAT_ROOMS: 'chat_rooms',
  CHAT_MESSAGES: 'chat_messages',
  ITEMS: 'items',
  TRANSACTIONS: 'transactions',
  LEADERBOARDS: 'leaderboards',
  EVENTS: 'events',
  REPORTS: 'reports',
  ANALYTICS: 'analytics'
};

// ================================
// MODELO: USUÁRIO
// ================================

export class UserModel {
  constructor(data = {}) {
    this.uid = data.uid || null;
    this.email = data.email || '';
    this.displayName = data.displayName || '';
    this.photoURL = data.photoURL || null;
    this.phoneNumber = data.phoneNumber || null;
    this.isVip = data.isVip || false;
    this.vipTier = data.vipTier || 'free'; // free, premium, ultimate
    this.vipExpiresAt = data.vipExpiresAt || null;
    this.coins = data.coins || 1000;
    this.gems = data.gems || 0;
    this.level = data.level || 1;
    this.experience = data.experience || 0;
    this.reputation = data.reputation || 0;
    this.settings = data.settings || {
      notifications: true,
      sound: true,
      music: true,
      language: 'pt-BR',
      theme: 'light'
    };
    this.stats = data.stats || {
      totalBattles: 0,
      battlesWon: 0,
      battlesLost: 0,
      pokemonCaught: 0,
      shinyFound: 0,
      legendariesCaught: 0,
      totalPlayTime: 0,
      loginStreak: 0,
      lastLoginDate: null
    };
    this.achievements = data.achievements || [];
    this.bannedUntil = data.bannedUntil || null;
    this.banReason = data.banReason || null;
    this.createdAt = data.createdAt || serverTimestamp();
    this.updatedAt = data.updatedAt || serverTimestamp();
    this.lastLoginAt = data.lastLoginAt || serverTimestamp();
  }

  // Métodos estáticos para operações no Firestore
  static async create(userData) {
    const user = new UserModel(userData);
    const docRef = await addDoc(collection(firestore, COLLECTIONS.USERS), {
      ...user,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { id: docRef.id, ...user };
  }

  static async getById(uid) {
    const docRef = doc(firestore, COLLECTIONS.USERS, uid);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
  }

  static async update(uid, updateData) {
    const docRef = doc(firestore, COLLECTIONS.USERS, uid);
    await updateDoc(docRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });
  }

  static async updateStats(uid, statsUpdate) {
    const docRef = doc(firestore, COLLECTIONS.USERS, uid);
    const updateObject = {};
    
    Object.keys(statsUpdate).forEach(key => {
      updateObject[`stats.${key}`] = increment(statsUpdate[key]);
    });
    
    await updateDoc(docRef, {
      ...updateObject,
      updatedAt: serverTimestamp()
    });
  }

  static async addAchievement(uid, achievementId) {
    const docRef = doc(firestore, COLLECTIONS.USERS, uid);
    await updateDoc(docRef, {
      achievements: arrayUnion(achievementId),
      updatedAt: serverTimestamp()
    });
  }
}

// ================================
// MODELO: PERSONAGEM
// ================================

export class CharacterModel {
  constructor(data = {}) {
    this.id = data.id || null;
    this.userId = data.userId || '';
    this.name = data.name || '';
    this.class = data.class || 'Treinador'; // Treinador, Pesquisador, Vilão
    this.origin = data.origin || 'Kanto';
    this.gender = data.gender || 'Masculino';
    this.avatar = data.avatar || null;
    this.level = data.level || 1;
    this.experience = data.experience || 0;
    this.coins = data.coins || 1000;
    this.gems = data.gems || 0;
    this.reputation = data.reputation || 0;
    this.fame = data.fame || 0;
    this.starterPokemonId = data.starterPokemonId || 1;
    this.starterPokemonName = data.starterPokemonName || '';
    this.starterPokemonGender = data.starterPokemonGender || null;
    this.currentLocation = data.currentLocation || 'Pallet Town';
    this.badges = data.badges || [];
    this.ribbons = data.ribbons || [];
    this.titles = data.titles || [];
    this.activeTitle = data.activeTitle || null;
    this.team = data.team || []; // Array de IDs dos Pokémon na equipe (máx 6)
    this.boxCount = data.boxCount || 1; // Número de boxes desbloqueadas
    this.inventory = data.inventory || {
      pokeballs: { pokeball: 10, greatball: 5, ultraball: 1 },
      items: {},
      tms: {},
      berries: {},
      medicine: { potion: 5, superpotion: 2 }
    };
    this.stats = data.stats || {
      totalBattles: 0,
      battlesWon: 0,
      battlesLost: 0,
      pokemonCaught: 0,
      shinyFound: 0,
      gymBadges: 0,
      contestRibbons: 0,
      totalSteps: 0,
      totalPlayTime: 0
    };
    this.preferences = data.preferences || {
      battleAnimations: true,
      battleText: 'normal',
      soundEffects: true
    };
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.createdAt = data.createdAt || serverTimestamp();
    this.updatedAt = data.updatedAt || serverTimestamp();
  }

  static async create(characterData) {
    const character = new CharacterModel(characterData);
    const docRef = await addDoc(collection(firestore, COLLECTIONS.CHARACTERS), {
      ...character,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { id: docRef.id, ...character };
  }

  static async getById(characterId) {
    const docRef = doc(firestore, COLLECTIONS.CHARACTERS, characterId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
  }

  static async getUserCharacters(userId) {
    const q = query(
      collection(firestore, COLLECTIONS.CHARACTERS),
      where('userId', '==', userId),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  static async update(characterId, updateData) {
    const docRef = doc(firestore, COLLECTIONS.CHARACTERS, characterId);
    await updateDoc(docRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });
  }

  static async addToTeam(characterId, pokemonId) {
    const docRef = doc(firestore, COLLECTIONS.CHARACTERS, characterId);
    await updateDoc(docRef, {
      team: arrayUnion(pokemonId),
      updatedAt: serverTimestamp()
    });
  }

  static async removeFromTeam(characterId, pokemonId) {
    const docRef = doc(firestore, COLLECTIONS.CHARACTERS, characterId);
    await updateDoc(docRef, {
      team: arrayRemove(pokemonId),
      updatedAt: serverTimestamp()
    });
  }

  static async updateInventory(characterId, inventoryUpdate) {
    const docRef = doc(firestore, COLLECTIONS.CHARACTERS, characterId);
    const updateObject = {};
    
    Object.keys(inventoryUpdate).forEach(category => {
      Object.keys(inventoryUpdate[category]).forEach(item => {
        updateObject[`inventory.${category}.${item}`] = increment(inventoryUpdate[category][item]);
      });
    });
    
    await updateDoc(docRef, {
      ...updateObject,
      updatedAt: serverTimestamp()
    });
  }
}

// ================================
// MODELO: POKÉMON CAPTURADO
// ================================

export class CapturedPokemonModel {
  constructor(data = {}) {
    this.id = data.id || null;
    this.characterId = data.characterId || '';
    this.pokemonId = data.pokemonId || 1; // ID da PokeAPI
    this.nickname = data.nickname || null;
    this.level = data.level || 5;
    this.experience = data.experience || 0;
    this.isShiny = data.isShiny || false;
    this.gender = data.gender || null; // 'M', 'F', ou null para sem gênero
    this.nature = data.nature || 'Hardy';
    this.ability = data.ability || '';
    this.hiddenAbility = data.hiddenAbility || false;
    this.originalTrainer = data.originalTrainer || '';
    this.trainerId = data.trainerId || '';
    this.friendship = data.friendship || 70;
    
    // IVs (Individual Values) - 0 a 31
    this.ivs = data.ivs || {
      hp: Math.floor(Math.random() * 32),
      attack: Math.floor(Math.random() * 32),
      defense: Math.floor(Math.random() * 32),
      spAttack: Math.floor(Math.random() * 32),
      spDefense: Math.floor(Math.random() * 32),
      speed: Math.floor(Math.random() * 32)
    };
    
    // EVs (Effort Values) - 0 a 255, máximo 510 total
    this.evs = data.evs || {
      hp: 0,
      attack: 0,
      defense: 0,
      spAttack: 0,
      spDefense: 0,
      speed: 0
    };
    
    // Status de batalha
    this.currentHp = data.currentHp || null; // Calculado baseado no nível
    this.maxHp = data.maxHp || null; // Calculado baseado no nível
    this.status = data.status || 'healthy'; // healthy, poisoned, burned, frozen, paralyzed, asleep
    this.statusTurns = data.statusTurns || 0;
    
    // Movimentos (máximo 4)
    this.moves = data.moves || [];
    this.ppCurrent = data.ppCurrent || {}; // PP atual de cada movimento
    this.ppMax = data.ppMax || {}; // PP máximo de cada movimento
    
    // Posição na equipe (1-6) ou null se estiver no PC
    this.teamPosition = data.teamPosition || null;
    this.boxNumber = data.boxNumber || 1;
    this.boxPosition = data.boxPosition || null;
    
    // Informações de captura
    this.caughtAt = data.caughtAt || serverTimestamp();
    this.caughtLocation = data.caughtLocation || '';
    this.caughtLevel = data.caughtLevel || data.level || 5;
    this.pokeball = data.pokeball || 'pokeball';
    this.caughtDate = data.caughtDate || new Date().toISOString().split('T')[0];
    
    // Histórico de batalhas
    this.battleStats = data.battleStats || {
      battlesParticipated: 0,
      battlesWon: 0,
      battlesLost: 0,
      damageDealt: 0,
      damageTaken: 0,
      pokemonDefeated: 0
    };
    
    // Ribbons e conquistas
    this.ribbons = data.ribbons || [];
    this.contestStats = data.contestStats || {
      beauty: 0,
      cute: 0,
      smart: 0,
      tough: 0,
      cool: 0
    };
    
    // Breeding
    this.eggGroups = data.eggGroups || [];
    this.breedingCompatible = data.breedingCompatible || true;
    this.eggMoves = data.eggMoves || [];
    
    this.createdAt = data.createdAt || serverTimestamp();
    this.updatedAt = data.updatedAt || serverTimestamp();
  }

  static async create(pokemonData) {
    const pokemon = new CapturedPokemonModel(pokemonData);
    const docRef = await addDoc(collection(firestore, COLLECTIONS.CAPTURED_POKEMON), {
      ...pokemon,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { id: docRef.id, ...pokemon };
  }

  static async getById(pokemonId) {
    const docRef = doc(firestore, COLLECTIONS.CAPTURED_POKEMON, pokemonId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
  }

  static async getCharacterPokemon(characterId, inTeamOnly = false) {
    let q = query(
      collection(firestore, COLLECTIONS.CAPTURED_POKEMON),
      where('characterId', '==', characterId)
    );
    
    if (inTeamOnly) {
      q = query(q, where('teamPosition', '!=', null), orderBy('teamPosition'));
    } else {
      q = query(q, orderBy('caughtAt', 'desc'));
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  static async update(pokemonId, updateData) {
    const docRef = doc(firestore, COLLECTIONS.CAPTURED_POKEMON, pokemonId);
    await updateDoc(docRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });
  }

  static async updateStats(pokemonId, statsUpdate) {
    const docRef = doc(firestore, COLLECTIONS.CAPTURED_POKEMON, pokemonId);
    const updateObject = {};
    
    Object.keys(statsUpdate).forEach(key => {
      updateObject[`battleStats.${key}`] = increment(statsUpdate[key]);
    });
    
    await updateDoc(docRef, {
      ...updateObject,
      updatedAt: serverTimestamp()
    });
  }

  static async heal(pokemonId) {
    const pokemon = await this.getById(pokemonId);
    if (!pokemon) return;
    
    await this.update(pokemonId, {
      currentHp: pokemon.maxHp,
      status: 'healthy',
      statusTurns: 0,
      ppCurrent: { ...pokemon.ppMax }
    });
  }

  static async addToTeam(pokemonId, position) {
    await this.update(pokemonId, {
      teamPosition: position,
      boxNumber: null,
      boxPosition: null
    });
  }

  static async removeFromTeam(pokemonId, boxNumber = 1) {
    // Encontrar próxima posição disponível no box
    const q = query(
      collection(firestore, COLLECTIONS.CAPTURED_POKEMON),
      where('boxNumber', '==', boxNumber),
      orderBy('boxPosition', 'desc'),
      limit(1)
    );
    
    const snapshot = await getDocs(q);
    const lastPosition = snapshot.empty ? 0 : snapshot.docs[0].data().boxPosition;
    
    await this.update(pokemonId, {
      teamPosition: null,
      boxNumber: boxNumber,
      boxPosition: lastPosition + 1
    });
  }
}

// ================================
// MODELO: BATALHA
// ================================

export class BattleModel {
  constructor(data = {}) {
    this.id = data.id || null;
    this.type = data.type || 'pvp'; // pvp, pve, tournament, gym
    this.status = data.status || 'waiting'; // waiting, active, finished, cancelled
    this.mode = data.mode || 'single'; // single, double, triple, rotation
    this.rules = data.rules || {
      maxLevel: 100,
      itemsAllowed: true,
      legendariesAllowed: false,
      timeLimit: 300, // 5 minutos
      maxTeamSize: 6
    };
    
    // Participantes
    this.player1 = data.player1 || null; // { userId, characterId, team: [] }
    this.player2 = data.player2 || null;
    this.spectators = data.spectators || [];
    
    // Estado da batalha
    this.currentTurn = data.currentTurn || 1;
    this.activePlayer = data.activePlayer || 1;
    this.turnTimeLimit = data.turnTimeLimit || 30;
    this.turnStartTime = data.turnStartTime || null;
    
    // Pokémon ativos
    this.activePokemon = data.activePokemon || {
      player1: null,
      player2: null
    };
    
    // Campo de batalha
    this.field = data.field || {
      weather: null, // sun, rain, sandstorm, hail
      weatherTurns: 0,
      terrain: null, // electric, grassy, misty, psychic
      terrainTurns: 0,
      hazards: {
        player1: [], // spikes, stealth_rock, toxic_spikes
        player2: []
      }
    };
    
    // Log de ações
    this.battleLog = data.battleLog || [];
    this.winner = data.winner || null;
    this.loser = data.loser || null;
    this.endReason = data.endReason || null; // victory, forfeit, timeout, disconnect
    
    // Recompensas
    this.rewards = data.rewards || {
      experience: 0,
      coins: 0,
      items: []
    };
    
    this.createdAt = data.createdAt || serverTimestamp();
    this.startedAt = data.startedAt || null;
    this.finishedAt = data.finishedAt || null;
    this.updatedAt = data.updatedAt || serverTimestamp();
  }

  static async create(battleData) {
    const battle = new BattleModel(battleData);
    const docRef = await addDoc(collection(firestore, COLLECTIONS.BATTLES), {
      ...battle,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { id: docRef.id, ...battle };
  }

  static async getById(battleId) {
    const docRef = doc(firestore, COLLECTIONS.BATTLES, battleId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
  }

  static async update(battleId, updateData) {
    const docRef = doc(firestore, COLLECTIONS.BATTLES, battleId);
    await updateDoc(docRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });
  }

  static async addToLog(battleId, logEntry) {
    const docRef = doc(firestore, COLLECTIONS.BATTLES, battleId);
    await updateDoc(docRef, {
      battleLog: arrayUnion({
        ...logEntry,
        timestamp: serverTimestamp(),
        turn: logEntry.turn || 1
      }),
      updatedAt: serverTimestamp()
    });
  }

  static async finish(battleId, winnerId, loserId, endReason = 'victory') {
    await this.update(battleId, {
      status: 'finished',
      winner: winnerId,
      loser: loserId,
      endReason: endReason,
      finishedAt: serverTimestamp()
    });
  }
}

// ================================
// FUNÇÕES UTILITÁRIAS
// ================================

export const FirestoreUtils = {
  // Operações em lote para melhor performance
  async batchWrite(operations) {
    const batch = writeBatch(firestore);
    
    operations.forEach(operation => {
      const { type, ref, data } = operation;
      
      switch (type) {
        case 'set':
          batch.set(ref, data);
          break;
        case 'update':
          batch.update(ref, data);
          break;
        case 'delete':
          batch.delete(ref);
          break;
      }
    });
    
    await batch.commit();
  },
  
  // Paginação para listas grandes
  async getPaginatedData(collectionName, pageSize = 20, lastDoc = null, orderField = 'createdAt') {
    let q = query(
      collection(firestore, collectionName),
      orderBy(orderField, 'desc'),
      limit(pageSize)
    );
    
    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }
    
    const snapshot = await getDocs(q);
    const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const lastVisible = snapshot.docs[snapshot.docs.length - 1];
    
    return {
      data: docs,
      lastDoc: lastVisible,
      hasMore: docs.length === pageSize
    };
  },
  
  // Busca com filtros múltiplos
  async searchWithFilters(collectionName, filters = [], orderField = 'createdAt', pageSize = 20) {
    let q = collection(firestore, collectionName);
    
    filters.forEach(filter => {
      q = query(q, where(filter.field, filter.operator, filter.value));
    });
    
    q = query(q, orderBy(orderField, 'desc'), limit(pageSize));
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
};

export default {
  UserModel,
  CharacterModel,
  CapturedPokemonModel,
  BattleModel,
  FirestoreUtils,
  COLLECTIONS
};

