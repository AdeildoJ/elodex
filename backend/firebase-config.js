// firebase-config.js
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getDatabase, connectDatabaseEmulator } from 'firebase/database';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

// Configuração do Firebase - SUBSTITUA PELOS SEUS DADOS
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "pokemon-app-project.firebaseapp.com",
  databaseURL: "https://pokemon-app-project-default-rtdb.firebaseio.com",
  projectId: "pokemon-app-project",
  storageBucket: "pokemon-app-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456",
  measurementId: "G-ABCDEF123"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar serviços
export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const realtimeDb = getDatabase(app);
export const functions = getFunctions(app);
export const storage = getStorage(app);

// Configuração para desenvolvimento (emuladores)
if (__DEV__) {
  // Conectar aos emuladores apenas se ainda não estiverem conectados
  try {
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    connectFirestoreEmulator(firestore, 'localhost', 8080);
    connectDatabaseEmulator(realtimeDb, 'localhost', 9000);
    connectFunctionsEmulator(functions, 'localhost', 5001);
    connectStorageEmulator(storage, 'localhost', 9199);
  } catch (error) {
    console.log('Emulators already connected or not available');
  }
}

// Configurações para escalabilidade
export const FIREBASE_CONFIG = {
  // Limites para tier gratuito e pago
  FREE_TIER_LIMITS: {
    DAILY_READS: 50000,
    DAILY_WRITES: 20000,
    DAILY_DELETES: 20000,
    STORAGE_GB: 1,
    BANDWIDTH_GB: 10,
    CONCURRENT_CONNECTIONS: 100
  },
  
  PAID_TIER_LIMITS: {
    DAILY_READS: 1000000,
    DAILY_WRITES: 1000000,
    DAILY_DELETES: 1000000,
    STORAGE_GB: 100,
    BANDWIDTH_GB: 1000,
    CONCURRENT_CONNECTIONS: 100000
  },
  
  // Configurações de cache para otimização
  CACHE_SETTINGS: {
    POKEMON_DATA_TTL: 24 * 60 * 60 * 1000, // 24 horas
    USER_DATA_TTL: 5 * 60 * 1000, // 5 minutos
    BATTLE_DATA_TTL: 30 * 1000, // 30 segundos
    LEADERBOARD_TTL: 10 * 60 * 1000 // 10 minutos
  },
  
  // Configurações de batch para operações em massa
  BATCH_SIZES: {
    FIRESTORE_BATCH: 500, // Máximo do Firestore
    REALTIME_BATCH: 100,
    USER_MIGRATION: 1000
  }
};

export default app;

