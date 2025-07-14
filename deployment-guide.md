# 🚀 GUIA COMPLETO DE DEPLOYMENT - APP POKÉMON

## 📋 ÍNDICE
1. [Configuração Inicial do Firebase](#configuração-inicial)
2. [Deploy das Cloud Functions](#cloud-functions)
3. [Configuração do Firestore](#firestore)
4. [Configuração do Realtime Database](#realtime-database)
5. [Configuração de Autenticação](#autenticação)
6. [Configuração de Storage](#storage)
7. [Monitoramento e Analytics](#monitoramento)
8. [Testes e Validação](#testes)
9. [Escalabilidade para 100k+ Usuários](#escalabilidade)
10. [Manutenção e Backup](#manutenção)

---

## 🔧 CONFIGURAÇÃO INICIAL

### 1. Criar Projeto Firebase

```bash
# 1. Instalar Firebase CLI
npm install -g firebase-tools

# 2. Fazer login
firebase login

# 3. Criar projeto
firebase projects:create pokemon-app-prod --display-name "Pokemon App"

# 4. Selecionar projeto
firebase use pokemon-app-prod
```

### 2. Configurar Planos de Billing

```bash
# Upgrade para Blaze Plan (necessário para Cloud Functions)
# Acesse: https://console.firebase.google.com/project/pokemon-app-prod/usage/details
# Clique em "Upgrade" e selecione "Blaze Plan"
```

### 3. Estrutura de Arquivos

```
pokemon-app/
├── firebase.json
├── .firebaserc
├── firestore.rules
├── firestore.indexes.json
├── database.rules.json
├── storage.rules
├── functions/
│   ├── package.json
│   ├── index.js
│   └── src/
│       ├── auth.js
│       ├── characters.js
│       ├── battles.js
│       └── utils.js
└── public/
    └── index.html
```

---

## ☁️ CLOUD FUNCTIONS

### 1. Inicializar Functions

```bash
# Inicializar Functions
firebase init functions

# Selecionar:
# - JavaScript
# - Instalar dependências com npm
```

### 2. Configurar package.json

```json
{
  "name": "pokemon-app-functions",
  "version": "1.0.0",
  "engines": {
    "node": "18"
  },
  "dependencies": {
    "firebase-admin": "^11.0.0",
    "firebase-functions": "^4.0.0",
    "axios": "^1.4.0",
    "lodash": "^4.17.21"
  },
  "scripts": {
    "serve": "firebase emulators:start --only functions",
    "shell": "firebase functions:shell",
    "start": "npm run shell",
    "deploy": "firebase deploy --only functions",
    "logs": "firebase functions:log"
  }
}
```

### 3. Deploy das Functions

```bash
# Deploy todas as functions
firebase deploy --only functions

# Deploy function específica
firebase deploy --only functions:createUserProfile

# Verificar logs
firebase functions:log
```

---

## 🗄️ FIRESTORE

### 1. Configurar Regras de Segurança

```bash
# Copiar regras do arquivo firestore-security-rules.js
# Para firestore.rules

# Deploy das regras
firebase deploy --only firestore:rules
```

### 2. Configurar Índices

```json
{
  "indexes": [
    {
      "collectionGroup": "characters",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "isActive", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "captured_pokemon",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "characterId", "order": "ASCENDING" },
        { "fieldPath": "teamPosition", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "battles",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "player1.userId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "chat_messages",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "roomId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "ASCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

```bash
# Deploy dos índices
firebase deploy --only firestore:indexes
```

### 3. Configurar Dados Iniciais

```javascript
// Script para popular dados iniciais
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();

async function initializeGlobalData() {
  // Configurações globais
  await db.collection('global').doc('settings').set({
    maintenanceMode: false,
    minAppVersion: '1.0.0',
    maxPlayersPerBattle: 2,
    defaultStarterLevel: 5,
    maxCharactersPerUser: 1,
    maxCharactersPerVip: 10,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // Itens da PokéMart
  await db.collection('global').doc('pokemart').set({
    staticItems: [
      { id: 'pokeball', name: 'Poké Ball', price: 200, category: 'pokeball' },
      { id: 'greatball', name: 'Great Ball', price: 600, category: 'pokeball' },
      { id: 'ultraball', name: 'Ultra Ball', price: 1200, category: 'pokeball' },
      { id: 'potion', name: 'Potion', price: 300, category: 'healing' },
      { id: 'super_potion', name: 'Super Potion', price: 700, category: 'healing' }
    ],
    rotatingItems: [],
    lastRotation: admin.firestore.FieldValue.serverTimestamp()
  });

  console.log('Dados globais inicializados');
}

// Executar
initializeGlobalData().catch(console.error);
```

---

## 📊 REALTIME DATABASE

### 1. Configurar Regras

```json
{
  "rules": {
    "battles": {
      "$battleId": {
        ".read": "auth != null && (data.child('player1/userId').val() == auth.uid || data.child('player2/userId').val() == auth.uid || data.child('spectators').hasChild(auth.uid))",
        ".write": "auth != null && (data.child('player1/userId').val() == auth.uid || data.child('player2/userId').val() == auth.uid)",
        ".validate": "newData.hasChildren(['player1', 'player2', 'status', 'currentTurn'])"
      }
    },
    "presence": {
      "$userId": {
        ".read": "auth != null",
        ".write": "auth != null && auth.uid == $userId",
        ".validate": "newData.hasChildren(['online', 'lastSeen'])"
      }
    },
    "matchmaking": {
      "$userId": {
        ".read": "auth != null && auth.uid == $userId",
        ".write": "auth != null && auth.uid == $userId",
        ".validate": "newData.hasChildren(['characterId', 'battleType', 'timestamp'])"
      }
    },
    "notifications": {
      "$userId": {
        ".read": "auth != null && auth.uid == $userId",
        ".write": "auth != null && auth.uid == $userId"
      }
    }
  }
}
```

```bash
# Deploy das regras
firebase deploy --only database
```

---

## 🔐 AUTENTICAÇÃO

### 1. Configurar Provedores

```bash
# Via Console Firebase:
# 1. Acesse Authentication > Sign-in method
# 2. Habilite:
#    - Email/Password
#    - Google
#    - Facebook (opcional)
#    - Anonymous (para guests)
```

### 2. Configurar Domínios Autorizados

```bash
# Adicionar domínios autorizados:
# - localhost (desenvolvimento)
# - seu-dominio.com (produção)
# - app-pokemon.web.app (Firebase Hosting)
```

### 3. Templates de Email

```html
<!-- Template de Verificação de Email -->
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Verificar Email - Pokémon App</title>
  <style>
    body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; }
    .header { background: #dc3545; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; }
    .button { background: #ffc107; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔥 Pokémon App</h1>
    </div>
    <div class="content">
      <h2>Verificar seu Email</h2>
      <p>Olá, Treinador!</p>
      <p>Clique no botão abaixo para verificar seu email e começar sua jornada Pokémon:</p>
      <a href="%LINK%" class="button">Verificar Email</a>
      <p>Se você não criou uma conta, pode ignorar este email.</p>
    </div>
  </div>
</body>
</html>
```

---

## 📦 STORAGE

### 1. Configurar Regras

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Avatars de usuários
    match /avatars/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId
                   && request.resource.size < 5 * 1024 * 1024 // 5MB
                   && request.resource.contentType.matches('image/.*');
    }
    
    // Screenshots de batalhas
    match /battle_screenshots/{battleId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null
                   && request.resource.size < 10 * 1024 * 1024 // 10MB
                   && request.resource.contentType.matches('image/.*');
    }
    
    // Assets do jogo (apenas leitura)
    match /game_assets/{allPaths=**} {
      allow read: if true;
      allow write: if false; // Apenas administradores via console
    }
  }
}
```

### 2. Estrutura de Pastas

```
storage/
├── avatars/
│   └── {userId}/
│       ├── profile.jpg
│       └── character_{characterId}.jpg
├── battle_screenshots/
│   └── {battleId}/
│       ├── start.jpg
│       └── end.jpg
├── game_assets/
│   ├── pokemon/
│   │   ├── sprites/
│   │   └── artwork/
│   ├── items/
│   ├── backgrounds/
│   └── ui/
└── backups/
    └── {date}/
        ├── users.json
        ├── characters.json
        └── pokemon.json
```

---

## 📈 MONITORAMENTO

### 1. Configurar Analytics

```javascript
// firebase-config.js
import { getAnalytics, logEvent } from 'firebase/analytics';

const analytics = getAnalytics(app);

// Eventos customizados
export const trackEvent = (eventName, parameters = {}) => {
  logEvent(analytics, eventName, parameters);
};

// Eventos específicos do jogo
export const trackPokemonCaught = (pokemonId, isShiny) => {
  trackEvent('pokemon_caught', {
    pokemon_id: pokemonId,
    is_shiny: isShiny
  });
};

export const trackBattleStarted = (battleType) => {
  trackEvent('battle_started', {
    battle_type: battleType
  });
};
```

### 2. Configurar Performance Monitoring

```javascript
// firebase-config.js
import { getPerformance } from 'firebase/performance';

const perf = getPerformance(app);

// Métricas customizadas
export const measurePerformance = (name, fn) => {
  const trace = perf.trace(name);
  trace.start();
  
  return Promise.resolve(fn()).finally(() => {
    trace.stop();
  });
};
```

### 3. Configurar Crashlytics

```bash
# Para React Native
npm install @react-native-firebase/crashlytics

# Para Web
npm install firebase
```

---

## 🧪 TESTES

### 1. Emuladores Locais

```bash
# Instalar emuladores
firebase init emulators

# Configurar firebase.json
{
  "emulators": {
    "auth": {
      "port": 9099
    },
    "functions": {
      "port": 5001
    },
    "firestore": {
      "port": 8080
    },
    "database": {
      "port": 9000
    },
    "hosting": {
      "port": 5000
    },
    "storage": {
      "port": 9199
    },
    "ui": {
      "enabled": true,
      "port": 4000
    }
  }
}

# Iniciar emuladores
firebase emulators:start
```

### 2. Testes de Carga

```javascript
// load-test.js
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function createTestUsers(count) {
  const batch = db.batch();
  
  for (let i = 0; i < count; i++) {
    const userRef = db.collection('users').doc(`test_user_${i}`);
    batch.set(userRef, {
      email: `test${i}@example.com`,
      displayName: `Test User ${i}`,
      isVip: Math.random() > 0.9, // 10% VIP
      coins: Math.floor(Math.random() * 10000),
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    if (i % 500 === 0) {
      await batch.commit();
      console.log(`Criados ${i} usuários de teste`);
    }
  }
  
  await batch.commit();
  console.log(`Total: ${count} usuários de teste criados`);
}

// Criar 10.000 usuários de teste
createTestUsers(10000).catch(console.error);
```

---

## 📊 ESCALABILIDADE PARA 100K+ USUÁRIOS

### 1. Configurações de Quota

```bash
# Aumentar quotas no Console Google Cloud
# 1. Acesse: https://console.cloud.google.com/iam-admin/quotas
# 2. Filtrar por "Firebase"
# 3. Solicitar aumento para:
#    - Firestore: 1M operações/dia → 100M operações/dia
#    - Cloud Functions: 2M invocações/mês → 100M invocações/mês
#    - Realtime Database: 100 conexões simultâneas → 100.000 conexões
```

### 2. Otimizações de Performance

```javascript
// Implementar cache em múltiplas camadas
class CacheManager {
  constructor() {
    this.memoryCache = new Map();
    this.localStorageCache = new Map();
  }
  
  async get(key) {
    // 1. Verificar cache em memória
    if (this.memoryCache.has(key)) {
      return this.memoryCache.get(key);
    }
    
    // 2. Verificar localStorage
    const cached = localStorage.getItem(`cache_${key}`);
    if (cached) {
      const data = JSON.parse(cached);
      if (Date.now() - data.timestamp < 300000) { // 5 minutos
        this.memoryCache.set(key, data.value);
        return data.value;
      }
    }
    
    return null;
  }
  
  set(key, value, ttl = 300000) {
    // Salvar em memória
    this.memoryCache.set(key, value);
    
    // Salvar em localStorage
    localStorage.setItem(`cache_${key}`, JSON.stringify({
      value,
      timestamp: Date.now()
    }));
    
    // Limpar após TTL
    setTimeout(() => {
      this.memoryCache.delete(key);
      localStorage.removeItem(`cache_${key}`);
    }, ttl);
  }
}
```

### 3. Sharding de Dados

```javascript
// Implementar sharding para coleções grandes
function getShardedCollection(baseCollection, shardKey) {
  const shardId = hashCode(shardKey) % 10; // 10 shards
  return `${baseCollection}_shard_${shardId}`;
}

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

// Uso
const userShardCollection = getShardedCollection('users', userId);
```

### 4. Rate Limiting

```javascript
// Implementar rate limiting
class RateLimiter {
  constructor(maxRequests = 100, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = new Map();
  }
  
  isAllowed(userId) {
    const now = Date.now();
    const userRequests = this.requests.get(userId) || [];
    
    // Remover requisições antigas
    const validRequests = userRequests.filter(
      timestamp => now - timestamp < this.windowMs
    );
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(userId, validRequests);
    return true;
  }
}
```

---

## 🔧 MANUTENÇÃO

### 1. Backup Automático

```javascript
// backup-script.js
const admin = require('firebase-admin');
const { Storage } = require('@google-cloud/storage');

const storage = new Storage();
const bucket = storage.bucket('pokemon-app-backups');

async function backupFirestore() {
  const collections = ['users', 'characters', 'captured_pokemon'];
  const timestamp = new Date().toISOString().split('T')[0];
  
  for (const collectionName of collections) {
    const snapshot = await admin.firestore().collection(collectionName).get();
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    const fileName = `${timestamp}/${collectionName}.json`;
    const file = bucket.file(fileName);
    
    await file.save(JSON.stringify(data, null, 2), {
      metadata: {
        contentType: 'application/json'
      }
    });
    
    console.log(`Backup criado: ${fileName}`);
  }
}

// Executar backup
backupFirestore().catch(console.error);
```

### 2. Monitoramento de Saúde

```javascript
// health-check.js
const admin = require('firebase-admin');

async function healthCheck() {
  const checks = {
    firestore: false,
    realtimeDb: false,
    auth: false,
    functions: false
  };
  
  try {
    // Testar Firestore
    await admin.firestore().collection('health').doc('test').set({
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    checks.firestore = true;
  } catch (error) {
    console.error('Firestore health check failed:', error);
  }
  
  try {
    // Testar Realtime Database
    await admin.database().ref('health/test').set({
      timestamp: admin.database.ServerValue.TIMESTAMP
    });
    checks.realtimeDb = true;
  } catch (error) {
    console.error('Realtime DB health check failed:', error);
  }
  
  try {
    // Testar Auth
    const users = await admin.auth().listUsers(1);
    checks.auth = true;
  } catch (error) {
    console.error('Auth health check failed:', error);
  }
  
  const allHealthy = Object.values(checks).every(check => check);
  
  console.log('Health Check Results:', checks);
  console.log('Overall Status:', allHealthy ? 'HEALTHY' : 'UNHEALTHY');
  
  return { checks, healthy: allHealthy };
}

// Executar a cada 5 minutos
setInterval(healthCheck, 5 * 60 * 1000);
```

### 3. Limpeza de Dados

```bash
# Script de limpeza semanal
#!/bin/bash

echo "Iniciando limpeza de dados..."

# Limpar batalhas antigas (30+ dias)
node cleanup-old-battles.js

# Limpar mensagens de chat antigas (7+ dias)
node cleanup-old-messages.js

# Limpar notificações antigas (30+ dias)
node cleanup-old-notifications.js

# Compactar logs
gzip /var/log/pokemon-app/*.log

echo "Limpeza concluída!"
```

---

## 🚀 DEPLOY FINAL

### 1. Checklist Pré-Deploy

```bash
# ✅ Verificar configurações
firebase use pokemon-app-prod

# ✅ Testar localmente
firebase emulators:start
npm run test

# ✅ Verificar regras de segurança
firebase deploy --only firestore:rules --dry-run

# ✅ Verificar índices
firebase deploy --only firestore:indexes --dry-run

# ✅ Verificar functions
firebase deploy --only functions --dry-run
```

### 2. Deploy Completo

```bash
# Deploy tudo
firebase deploy

# Ou deploy por partes
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
firebase deploy --only functions
firebase deploy --only database
firebase deploy --only storage
```

### 3. Verificação Pós-Deploy

```bash
# Verificar status
firebase projects:list
firebase functions:list

# Verificar logs
firebase functions:log --limit 50

# Testar endpoints
curl -X POST https://us-central1-pokemon-app-prod.cloudfunctions.net/healthCheck
```

---

## 📊 CUSTOS ESTIMADOS (100K USUÁRIOS)

### Firebase Blaze Plan - Estimativa Mensal

| Serviço | Uso Estimado | Custo |
|---------|--------------|-------|
| Firestore | 50M leituras, 10M escritas | $180 |
| Cloud Functions | 20M invocações | $40 |
| Realtime Database | 10GB transferência | $50 |
| Authentication | 100K MAU | $0 (gratuito) |
| Storage | 100GB | $2.60 |
| Hosting | 10GB transferência | $1.15 |
| **TOTAL** | | **~$274/mês** |

### Otimizações de Custo

1. **Cache agressivo** - Reduzir leituras do Firestore em 60%
2. **Batch operations** - Reduzir escritas em 40%
3. **Compression** - Reduzir transferência em 50%
4. **Custo otimizado estimado: ~$165/mês**

---

## 🎯 PRÓXIMOS PASSOS

1. **Configurar projeto Firebase** seguindo este guia
2. **Deploy das Cloud Functions** para automação
3. **Configurar regras de segurança** para proteção
4. **Implementar monitoramento** para observabilidade
5. **Testar com dados reais** para validação
6. **Otimizar performance** baseado em métricas
7. **Preparar para produção** com todos os checks

---

**🔥 Seu backend está pronto para suportar 100.000+ jogadores simultâneos!**

Para dúvidas ou suporte, consulte a [documentação oficial do Firebase](https://firebase.google.com/docs).

