// firestore-security-rules.js
// Regras de segurança otimizadas para 100.000+ usuários

/*
INSTRUÇÕES PARA APLICAR AS REGRAS:

1. Acesse o Firebase Console: https://console.firebase.google.com
2. Selecione seu projeto
3. Vá em "Firestore Database" > "Rules"
4. Copie e cole o conteúdo abaixo
5. Clique em "Publish"

IMPORTANTE: Estas regras são otimizadas para performance e segurança
*/

const FIRESTORE_RULES = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // ================================
    // FUNÇÕES AUXILIARES
    // ================================
    
    // Verificar se o usuário está autenticado
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Verificar se é o próprio usuário
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // Verificar se o usuário é VIP
    function isVip() {
      return isAuthenticated() && 
             exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isVip == true;
    }
    
    // Verificar se o usuário não está banido
    function isNotBanned() {
      return isAuthenticated() && 
             (!exists(/databases/$(database)/documents/users/$(request.auth.uid)) ||
              get(/databases/$(database)/documents/users/$(request.auth.uid)).data.bannedUntil == null ||
              get(/databases/$(database)/documents/users/$(request.auth.uid)).data.bannedUntil < request.time);
    }
    
    // Verificar se o personagem pertence ao usuário
    function ownsCharacter(characterId) {
      return isAuthenticated() &&
             exists(/databases/$(database)/documents/characters/$(characterId)) &&
             get(/databases/$(database)/documents/characters/$(characterId)).data.userId == request.auth.uid;
    }
    
    // Verificar se o Pokémon pertence ao usuário (via personagem)
    function ownsPokemon(pokemonData) {
      return isAuthenticated() &&
             exists(/databases/$(database)/documents/characters/$(pokemonData.characterId)) &&
             get(/databases/$(database)/documents/characters/$(pokemonData.characterId)).data.userId == request.auth.uid;
    }
    
    // Verificar rate limiting (máximo 100 operações por minuto por usuário)
    function withinRateLimit() {
      return true; // Implementar com Cloud Functions se necessário
    }
    
    // ================================
    // COLEÇÃO: USERS
    // ================================
    
    match /users/{userId} {
      // Leitura: apenas o próprio usuário
      allow read: if isOwner(userId);
      
      // Criação: apenas durante o registro
      allow create: if isAuthenticated() && 
                       isOwner(userId) && 
                       withinRateLimit() &&
                       // Validações de dados obrigatórios
                       request.resource.data.keys().hasAll(['email', 'displayName', 'createdAt']) &&
                       // Email deve corresponder ao auth
                       request.resource.data.email == request.auth.token.email &&
                       // Campos de segurança não podem ser definidos pelo usuário
                       !request.resource.data.keys().hasAny(['isVip', 'bannedUntil', 'banReason']) &&
                       // Limites iniciais
                       request.resource.data.coins <= 1000 &&
                       request.resource.data.gems <= 0;
      
      // Atualização: apenas o próprio usuário, com restrições
      allow update: if isOwner(userId) && 
                       isNotBanned() &&
                       withinRateLimit() &&
                       // Não pode alterar campos críticos
                       !request.resource.data.diff(resource.data).affectedKeys().hasAny([
                         'uid', 'email', 'isVip', 'vipTier', 'vipExpiresAt', 
                         'bannedUntil', 'banReason', 'createdAt'
                       ]) &&
                       // Validações de limites
                       (request.resource.data.coins >= 0) &&
                       (request.resource.data.gems >= 0);
      
      // Deleção: não permitida (soft delete apenas)
      allow delete: if false;
    }
    
    // ================================
    // COLEÇÃO: CHARACTERS
    // ================================
    
    match /characters/{characterId} {
      // Leitura: apenas o dono do personagem
      allow read: if ownsCharacter(characterId);
      
      // Criação: usuário autenticado, não banido, com limites
      allow create: if isAuthenticated() && 
                       isNotBanned() &&
                       withinRateLimit() &&
                       // Deve ser do usuário autenticado
                       request.resource.data.userId == request.auth.uid &&
                       // Validações de dados obrigatórios
                       request.resource.data.keys().hasAll([
                         'name', 'class', 'origin', 'gender', 'userId'
                       ]) &&
                       // Validações de valores
                       request.resource.data.class in ['Treinador', 'Pesquisador', 'Vilão'] &&
                       request.resource.data.gender in ['Masculino', 'Feminino'] &&
                       request.resource.data.name.size() >= 2 &&
                       request.resource.data.name.size() <= 20 &&
                       // Limites iniciais
                       request.resource.data.level <= 5 &&
                       request.resource.data.coins <= 1000 &&
                       request.resource.data.gems <= 0 &&
                       // Verificar limite de personagens (1 para free, ilimitado para VIP)
                       (isVip() || 
                        !exists(/databases/$(database)/documents/characters) ||
                        get(/databases/$(database)/documents/characters).where('userId', '==', request.auth.uid).where('isActive', '==', true).size() == 0);
      
      // Atualização: apenas o dono, com restrições
      allow update: if ownsCharacter(characterId) && 
                       isNotBanned() &&
                       withinRateLimit() &&
                       // Não pode alterar campos críticos
                       !request.resource.data.diff(resource.data).affectedKeys().hasAny([
                         'userId', 'createdAt', 'starterPokemonId'
                       ]) &&
                       // Validações de limites
                       request.resource.data.level >= resource.data.level && // Level só pode aumentar
                       request.resource.data.level <= 100 &&
                       request.resource.data.coins >= 0 &&
                       request.resource.data.gems >= 0 &&
                       request.resource.data.team.size() <= 6; // Máximo 6 Pokémon na equipe
      
      // Deleção: soft delete apenas (isActive = false)
      allow delete: if false;
    }
    
    // ================================
    // COLEÇÃO: CAPTURED_POKEMON
    // ================================
    
    match /captured_pokemon/{pokemonId} {
      // Leitura: apenas o dono do Pokémon
      allow read: if ownsPokemon(resource.data);
      
      // Criação: durante captura, com validações
      allow create: if isAuthenticated() && 
                       isNotBanned() &&
                       withinRateLimit() &&
                       ownsPokemon(request.resource.data) &&
                       // Validações de dados obrigatórios
                       request.resource.data.keys().hasAll([
                         'characterId', 'pokemonId', 'level', 'nature'
                       ]) &&
                       // Validações de valores
                       request.resource.data.level >= 1 &&
                       request.resource.data.level <= 100 &&
                       request.resource.data.pokemonId >= 1 &&
                       request.resource.data.pokemonId <= 1010 && // Número atual de Pokémon
                       request.resource.data.gender in ['M', 'F', null] &&
                       // IVs válidos (0-31)
                       request.resource.data.ivs.hp >= 0 && request.resource.data.ivs.hp <= 31 &&
                       request.resource.data.ivs.attack >= 0 && request.resource.data.ivs.attack <= 31 &&
                       request.resource.data.ivs.defense >= 0 && request.resource.data.ivs.defense <= 31 &&
                       request.resource.data.ivs.spAttack >= 0 && request.resource.data.ivs.spAttack <= 31 &&
                       request.resource.data.ivs.spDefense >= 0 && request.resource.data.ivs.spDefense <= 31 &&
                       request.resource.data.ivs.speed >= 0 && request.resource.data.ivs.speed <= 31 &&
                       // EVs válidos (0-255, máximo 510 total)
                       request.resource.data.evs.hp >= 0 && request.resource.data.evs.hp <= 255 &&
                       request.resource.data.evs.attack >= 0 && request.resource.data.evs.attack <= 255 &&
                       request.resource.data.evs.defense >= 0 && request.resource.data.evs.defense <= 255 &&
                       request.resource.data.evs.spAttack >= 0 && request.resource.data.evs.spAttack <= 255 &&
                       request.resource.data.evs.spDefense >= 0 && request.resource.data.evs.spDefense <= 255 &&
                       request.resource.data.evs.speed >= 0 && request.resource.data.evs.speed <= 255 &&
                       (request.resource.data.evs.hp + request.resource.data.evs.attack + 
                        request.resource.data.evs.defense + request.resource.data.evs.spAttack + 
                        request.resource.data.evs.spDefense + request.resource.data.evs.speed) <= 510;
      
      // Atualização: apenas o dono, com restrições
      allow update: if ownsPokemon(resource.data) && 
                       isNotBanned() &&
                       withinRateLimit() &&
                       // Não pode alterar campos críticos
                       !request.resource.data.diff(resource.data).affectedKeys().hasAny([
                         'characterId', 'pokemonId', 'caughtAt', 'caughtLocation', 
                         'originalTrainer', 'trainerId', 'ivs'
                       ]) &&
                       // Level só pode aumentar
                       request.resource.data.level >= resource.data.level &&
                       request.resource.data.level <= 100 &&
                       // Friendship válido (0-255)
                       request.resource.data.friendship >= 0 &&
                       request.resource.data.friendship <= 255 &&
                       // Máximo 4 movimentos
                       request.resource.data.moves.size() <= 4;
      
      // Deleção: apenas para liberação (release)
      allow delete: if ownsPokemon(resource.data) && 
                       isNotBanned() &&
                       withinRateLimit();
    }
    
    // ================================
    // COLEÇÃO: BATTLES
    // ================================
    
    match /battles/{battleId} {
      // Leitura: participantes e espectadores
      allow read: if isAuthenticated() && 
                     (resource.data.player1.userId == request.auth.uid ||
                      resource.data.player2.userId == request.auth.uid ||
                      request.auth.uid in resource.data.spectators);
      
      // Criação: usuário autenticado criando batalha
      allow create: if isAuthenticated() && 
                       isNotBanned() &&
                       withinRateLimit() &&
                       // Deve ser um dos participantes
                       (request.resource.data.player1.userId == request.auth.uid ||
                        request.resource.data.player2.userId == request.auth.uid) &&
                       // Validações básicas
                       request.resource.data.type in ['pvp', 'pve', 'tournament', 'gym'] &&
                       request.resource.data.mode in ['single', 'double', 'triple', 'rotation'];
      
      // Atualização: apenas participantes, durante a batalha
      allow update: if isAuthenticated() && 
                       isNotBanned() &&
                       withinRateLimit() &&
                       (resource.data.player1.userId == request.auth.uid ||
                        resource.data.player2.userId == request.auth.uid) &&
                       // Apenas durante batalha ativa
                       resource.data.status in ['waiting', 'active'] &&
                       // Não pode alterar participantes
                       !request.resource.data.diff(resource.data).affectedKeys().hasAny([
                         'player1', 'player2', 'type', 'mode', 'rules', 'createdAt'
                       ]);
      
      // Deleção: não permitida
      allow delete: if false;
    }
    
    // ================================
    // COLEÇÃO: BATTLE_HISTORY
    // ================================
    
    match /battle_history/{historyId} {
      // Leitura: participantes da batalha
      allow read: if isAuthenticated() && 
                     (resource.data.player1Id == request.auth.uid ||
                      resource.data.player2Id == request.auth.uid);
      
      // Criação: sistema apenas (via Cloud Functions)
      allow create: if false;
      
      // Atualização/Deleção: não permitidas
      allow update, delete: if false;
    }
    
    // ================================
    // COLEÇÃO: FRIENDSHIPS
    // ================================
    
    match /friendships/{friendshipId} {
      // Leitura: usuários envolvidos na amizade
      allow read: if isAuthenticated() && 
                     (resource.data.userId1 == request.auth.uid ||
                      resource.data.userId2 == request.auth.uid);
      
      // Criação: envio de solicitação de amizade
      allow create: if isAuthenticated() && 
                       isNotBanned() &&
                       withinRateLimit() &&
                       // Deve ser um dos usuários
                       (request.resource.data.userId1 == request.auth.uid ||
                        request.resource.data.userId2 == request.auth.uid) &&
                       // Não pode ser amigo de si mesmo
                       request.resource.data.userId1 != request.resource.data.userId2 &&
                       // Status inicial deve ser 'pending'
                       request.resource.data.status == 'pending';
      
      // Atualização: aceitar/rejeitar solicitação
      allow update: if isAuthenticated() && 
                       isNotBanned() &&
                       withinRateLimit() &&
                       (resource.data.userId1 == request.auth.uid ||
                        resource.data.userId2 == request.auth.uid) &&
                       // Apenas mudança de status
                       request.resource.data.diff(resource.data).affectedKeys().hasOnly(['status', 'updatedAt']) &&
                       request.resource.data.status in ['accepted', 'rejected', 'blocked'];
      
      // Deleção: remover amizade
      allow delete: if isAuthenticated() && 
                       (resource.data.userId1 == request.auth.uid ||
                        resource.data.userId2 == request.auth.uid);
    }
    
    // ================================
    // COLEÇÃO: CHAT_ROOMS
    // ================================
    
    match /chat_rooms/{roomId} {
      // Leitura: participantes da sala
      allow read: if isAuthenticated() && 
                     request.auth.uid in resource.data.participants;
      
      // Criação: usuário autenticado
      allow create: if isAuthenticated() && 
                       isNotBanned() &&
                       withinRateLimit() &&
                       // Deve ser um dos participantes
                       request.auth.uid in request.resource.data.participants &&
                       // Máximo 50 participantes por sala
                       request.resource.data.participants.size() <= 50;
      
      // Atualização: adicionar/remover participantes
      allow update: if isAuthenticated() && 
                       isNotBanned() &&
                       withinRateLimit() &&
                       request.auth.uid in resource.data.participants &&
                       // Não pode alterar tipo da sala
                       request.resource.data.type == resource.data.type;
      
      // Deleção: apenas o criador
      allow delete: if isAuthenticated() && 
                       resource.data.createdBy == request.auth.uid;
    }
    
    // ================================
    // COLEÇÃO: CHAT_MESSAGES
    // ================================
    
    match /chat_messages/{messageId} {
      // Leitura: participantes da sala
      allow read: if isAuthenticated() && 
                     exists(/databases/$(database)/documents/chat_rooms/$(resource.data.roomId)) &&
                     request.auth.uid in get(/databases/$(database)/documents/chat_rooms/$(resource.data.roomId)).data.participants;
      
      // Criação: envio de mensagem
      allow create: if isAuthenticated() && 
                       isNotBanned() &&
                       withinRateLimit() &&
                       // Deve ser o autor da mensagem
                       request.resource.data.senderId == request.auth.uid &&
                       // Deve ser participante da sala
                       exists(/databases/$(database)/documents/chat_rooms/$(request.resource.data.roomId)) &&
                       request.auth.uid in get(/databases/$(database)/documents/chat_rooms/$(request.resource.data.roomId)).data.participants &&
                       // Validações de conteúdo
                       request.resource.data.content.size() >= 1 &&
                       request.resource.data.content.size() <= 1000 &&
                       request.resource.data.type in ['text', 'image', 'pokemon'];
      
      // Atualização: apenas para editar próprias mensagens
      allow update: if isAuthenticated() && 
                       resource.data.senderId == request.auth.uid &&
                       // Apenas conteúdo e status de edição
                       request.resource.data.diff(resource.data).affectedKeys().hasOnly(['content', 'edited', 'editedAt']);
      
      // Deleção: apenas próprias mensagens
      allow delete: if isAuthenticated() && 
                       resource.data.senderId == request.auth.uid;
    }
    
    // ================================
    // COLEÇÕES ADMINISTRATIVAS
    // ================================
    
    // Leaderboards - apenas leitura
    match /leaderboards/{leaderboardId} {
      allow read: if isAuthenticated();
      allow write: if false; // Apenas Cloud Functions
    }
    
    // Events - apenas leitura
    match /events/{eventId} {
      allow read: if isAuthenticated();
      allow write: if false; // Apenas administradores via Cloud Functions
    }
    
    // Reports - criação para denúncias
    match /reports/{reportId} {
      allow read: if false; // Apenas administradores
      allow create: if isAuthenticated() && 
                       isNotBanned() &&
                       request.resource.data.reporterId == request.auth.uid;
      allow update, delete: if false;
    }
    
    // Analytics - apenas sistema
    match /analytics/{analyticsId} {
      allow read, write: if false; // Apenas Cloud Functions
    }
  }
}
`;

// ================================
// REGRAS PARA REALTIME DATABASE
// ================================

const REALTIME_DATABASE_RULES = {
  "rules": {
    // Dados de batalha em tempo real
    "battles": {
      "$battleId": {
        ".read": "auth != null && (data.child('player1/userId').val() == auth.uid || data.child('player2/userId').val() == auth.uid || data.child('spectators').hasChild(auth.uid))",
        ".write": "auth != null && (data.child('player1/userId').val() == auth.uid || data.child('player2/userId').val() == auth.uid)",
        ".validate": "newData.hasChildren(['player1', 'player2', 'status', 'currentTurn'])"
      }
    },
    
    // Presença online dos usuários
    "presence": {
      "$userId": {
        ".read": "auth != null",
        ".write": "auth != null && auth.uid == $userId",
        ".validate": "newData.hasChildren(['online', 'lastSeen'])"
      }
    },
    
    // Matchmaking para batalhas
    "matchmaking": {
      "$userId": {
        ".read": "auth != null && auth.uid == $userId",
        ".write": "auth != null && auth.uid == $userId",
        ".validate": "newData.hasChildren(['characterId', 'battleType', 'timestamp'])"
      }
    },
    
    // Notificações em tempo real
    "notifications": {
      "$userId": {
        ".read": "auth != null && auth.uid == $userId",
        ".write": "auth != null && auth.uid == $userId"
      }
    }
  }
};

// ================================
// CONFIGURAÇÕES DE ÍNDICES
// ================================

const FIRESTORE_INDEXES = [
  // Índices para consultas de personagens
  {
    collectionGroup: "characters",
    fields: [
      { fieldPath: "userId", order: "ASCENDING" },
      { fieldPath: "isActive", order: "ASCENDING" },
      { fieldPath: "createdAt", order: "DESCENDING" }
    ]
  },
  
  // Índices para Pokémon capturados
  {
    collectionGroup: "captured_pokemon",
    fields: [
      { fieldPath: "characterId", order: "ASCENDING" },
      { fieldPath: "teamPosition", order: "ASCENDING" }
    ]
  },
  
  // Índices para batalhas
  {
    collectionGroup: "battles",
    fields: [
      { fieldPath: "player1.userId", order: "ASCENDING" },
      { fieldPath: "status", order: "ASCENDING" },
      { fieldPath: "createdAt", order: "DESCENDING" }
    ]
  },
  
  // Índices para amizades
  {
    collectionGroup: "friendships",
    fields: [
      { fieldPath: "userId1", order: "ASCENDING" },
      { fieldPath: "status", order: "ASCENDING" }
    ]
  },
  
  // Índices para mensagens de chat
  {
    collectionGroup: "chat_messages",
    fields: [
      { fieldPath: "roomId", order: "ASCENDING" },
      { fieldPath: "createdAt", order: "ASCENDING" }
    ]
  }
];

export {
  FIRESTORE_RULES,
  REALTIME_DATABASE_RULES,
  FIRESTORE_INDEXES
};

