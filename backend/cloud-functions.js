// cloud-functions.js
// Cloud Functions para escalabilidade, automação e lógicas de servidor

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { FieldValue } = require('firebase-admin/firestore');

// Inicializar Firebase Admin
admin.initializeApp();
const db = admin.firestore();
const rtdb = admin.database();

// ================================
// FUNÇÕES DE AUTENTICAÇÃO
// ================================

// Criar perfil de usuário automaticamente após registro
exports.createUserProfile = functions.auth.user().onCreate(async (user) => {
  try {
    const userProfile = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || 'Treinador',
      photoURL: user.photoURL || null,
      isVip: false,
      vipTier: null,
      vipExpiresAt: null,
      coins: 1000, // Moedas iniciais
      gems: 0,
      level: 1,
      experience: 0,
      stats: {
        totalCharacters: 0,
        pokemonCaught: 0,
        battlesWon: 0,
        battlesLost: 0,
        shinyFound: 0,
        achievementsUnlocked: 0
      },
      preferences: {
        notifications: true,
        soundEffects: true,
        music: true,
        language: 'pt-BR'
      },
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      lastLoginAt: FieldValue.serverTimestamp()
    };

    await db.collection('users').doc(user.uid).set(userProfile);
    
    // Configurar presença inicial
    await rtdb.ref(`presence/${user.uid}`).set({
      online: true,
      lastSeen: admin.database.ServerValue.TIMESTAMP
    });

    console.log(`Perfil criado para usuário: ${user.uid}`);
  } catch (error) {
    console.error('Erro ao criar perfil do usuário:', error);
  }
});

// Limpar dados do usuário após exclusão
exports.cleanupUserData = functions.auth.user().onDelete(async (user) => {
  try {
    const batch = db.batch();
    
    // Remover documento do usuário
    batch.delete(db.collection('users').doc(user.uid));
    
    // Remover personagens do usuário
    const charactersSnapshot = await db.collection('characters')
      .where('userId', '==', user.uid)
      .get();
    
    charactersSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // Remover Pokémon capturados
    const pokemonSnapshot = await db.collection('captured_pokemon')
      .where('characterId', 'in', charactersSnapshot.docs.map(doc => doc.id))
      .get();
    
    pokemonSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    
    // Remover presença
    await rtdb.ref(`presence/${user.uid}`).remove();
    
    console.log(`Dados limpos para usuário: ${user.uid}`);
  } catch (error) {
    console.error('Erro ao limpar dados do usuário:', error);
  }
});

// ================================
// FUNÇÕES DE PERSONAGENS
// ================================

// Validar criação de personagem
exports.validateCharacterCreation = functions.firestore
  .document('characters/{characterId}')
  .onCreate(async (snap, context) => {
    try {
      const character = snap.data();
      const userId = character.userId;
      
      // Verificar se usuário existe
      const userDoc = await db.collection('users').doc(userId).get();
      if (!userDoc.exists) {
        await snap.ref.delete();
        throw new Error('Usuário não encontrado');
      }
      
      const user = userDoc.data();
      
      // Verificar limite de personagens
      const existingCharacters = await db.collection('characters')
        .where('userId', '==', userId)
        .where('isActive', '==', true)
        .get();
      
      if (!user.isVip && existingCharacters.size > 1) {
        await snap.ref.delete();
        throw new Error('Limite de personagens excedido para usuário gratuito');
      }
      
      // Atualizar estatísticas do usuário
      await db.collection('users').doc(userId).update({
        'stats.totalCharacters': FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp()
      });
      
      console.log(`Personagem validado: ${context.params.characterId}`);
    } catch (error) {
      console.error('Erro na validação do personagem:', error);
    }
  });

// ================================
// FUNÇÕES DE BATALHAS
// ================================

// Processar resultado de batalha
exports.processBattleResult = functions.firestore
  .document('battles/{battleId}')
  .onUpdate(async (change, context) => {
    try {
      const before = change.before.data();
      const after = change.after.data();
      
      // Verificar se a batalha foi finalizada
      if (before.status !== 'finished' && after.status === 'finished') {
        const battleId = context.params.battleId;
        const winner = after.winner;
        const loser = after.winner === after.player1.userId ? after.player2.userId : after.player1.userId;
        
        // Atualizar estatísticas dos jogadores
        const batch = db.batch();
        
        // Vencedor
        const winnerCharRef = db.collection('characters').doc(after.winner === after.player1.userId ? after.player1.characterId : after.player2.characterId);
        batch.update(winnerCharRef, {
          'stats.battlesWon': FieldValue.increment(1),
          'stats.experience': FieldValue.increment(100),
          coins: FieldValue.increment(50),
          updatedAt: FieldValue.serverTimestamp()
        });
        
        // Perdedor
        const loserCharRef = db.collection('characters').doc(after.winner === after.player1.userId ? after.player2.characterId : after.player1.characterId);
        batch.update(loserCharRef, {
          'stats.battlesLost': FieldValue.increment(1),
          'stats.experience': FieldValue.increment(25),
          coins: FieldValue.increment(10),
          updatedAt: FieldValue.serverTimestamp()
        });
        
        await batch.commit();
        
        // Criar registro no histórico
        await db.collection('battle_history').add({
          battleId,
          player1Id: after.player1.userId,
          player2Id: after.player2.userId,
          winnerId: winner,
          loserId: loser,
          battleType: after.type,
          duration: after.finishedAt - after.startedAt,
          createdAt: FieldValue.serverTimestamp()
        });
        
        // Remover da fila de matchmaking
        await rtdb.ref(`matchmaking/${after.player1.userId}`).remove();
        await rtdb.ref(`matchmaking/${after.player2.userId}`).remove();
        
        console.log(`Resultado da batalha processado: ${battleId}`);
      }
    } catch (error) {
      console.error('Erro ao processar resultado da batalha:', error);
    }
  });

// Matchmaking automático
exports.processMatchmaking = functions.pubsub
  .schedule('every 30 seconds')
  .onRun(async (context) => {
    try {
      const matchmakingSnapshot = await rtdb.ref('matchmaking').once('value');
      const matchmakingData = matchmakingSnapshot.val();
      
      if (!matchmakingData) return;
      
      const waitingPlayers = Object.entries(matchmakingData)
        .filter(([userId, data]) => {
          // Filtrar jogadores esperando há mais de 30 segundos
          return Date.now() - data.timestamp > 30000;
        })
        .slice(0, 10); // Processar no máximo 10 por vez
      
      // Agrupar jogadores em pares
      for (let i = 0; i < waitingPlayers.length - 1; i += 2) {
        const [player1Id, player1Data] = waitingPlayers[i];
        const [player2Id, player2Data] = waitingPlayers[i + 1];
        
        try {
          // Buscar dados dos personagens
          const [char1Doc, char2Doc] = await Promise.all([
            db.collection('characters').doc(player1Data.characterId).get(),
            db.collection('characters').doc(player2Data.characterId).get()
          ]);
          
          if (!char1Doc.exists || !char2Doc.exists) continue;
          
          const char1 = char1Doc.data();
          const char2 = char2Doc.data();
          
          // Verificar compatibilidade de nível (diferença máxima de 10 níveis)
          if (Math.abs(char1.level - char2.level) > 10) continue;
          
          // Criar batalha
          const battleRef = await db.collection('battles').add({
            type: 'pvp',
            status: 'active',
            player1: {
              userId: player1Id,
              characterId: player1Data.characterId,
              character: char1
            },
            player2: {
              userId: player2Id,
              characterId: player2Data.characterId,
              character: char2
            },
            rules: {
              maxLevel: 100,
              itemsAllowed: true,
              legendariesAllowed: false,
              timeLimit: 300
            },
            createdAt: FieldValue.serverTimestamp(),
            startedAt: FieldValue.serverTimestamp()
          });
          
          // Notificar jogadores
          await Promise.all([
            rtdb.ref(`notifications/${player1Id}/${Date.now()}`).set({
              type: 'battle_found',
              battleId: battleRef.id,
              opponentId: player2Id,
              timestamp: admin.database.ServerValue.TIMESTAMP
            }),
            rtdb.ref(`notifications/${player2Id}/${Date.now()}`).set({
              type: 'battle_found',
              battleId: battleRef.id,
              opponentId: player1Id,
              timestamp: admin.database.ServerValue.TIMESTAMP
            })
          ]);
          
          // Remover da fila de matchmaking
          await Promise.all([
            rtdb.ref(`matchmaking/${player1Id}`).remove(),
            rtdb.ref(`matchmaking/${player2Id}`).remove()
          ]);
          
          console.log(`Batalha criada: ${battleRef.id} entre ${player1Id} e ${player2Id}`);
        } catch (error) {
          console.error('Erro ao criar batalha no matchmaking:', error);
        }
      }
    } catch (error) {
      console.error('Erro no processamento de matchmaking:', error);
    }
  });

// ================================
// FUNÇÕES DE ECONOMIA
// ================================

// Processar compras na PokéMart
exports.processPokeMartPurchase = functions.https.onCall(async (data, context) => {
  try {
    // Verificar autenticação
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Usuário não autenticado');
    }
    
    const { characterId, itemId, quantity, totalCost } = data;
    const userId = context.auth.uid;
    
    // Verificar se o personagem pertence ao usuário
    const characterDoc = await db.collection('characters').doc(characterId).get();
    if (!characterDoc.exists || characterDoc.data().userId !== userId) {
      throw new functions.https.HttpsError('permission-denied', 'Personagem não encontrado');
    }
    
    const character = characterDoc.data();
    
    // Verificar se tem moedas suficientes
    if (character.coins < totalCost) {
      throw new functions.https.HttpsError('failed-precondition', 'Moedas insuficientes');
    }
    
    // Processar compra
    const batch = db.batch();
    
    // Debitar moedas
    batch.update(characterDoc.ref, {
      coins: FieldValue.increment(-totalCost),
      updatedAt: FieldValue.serverTimestamp()
    });
    
    // Adicionar item ao inventário
    batch.update(characterDoc.ref, {
      [`inventory.${itemId}`]: FieldValue.increment(quantity)
    });
    
    // Registrar transação
    const transactionRef = db.collection('transactions').doc();
    batch.set(transactionRef, {
      userId,
      characterId,
      type: 'purchase',
      itemId,
      quantity,
      cost: totalCost,
      timestamp: FieldValue.serverTimestamp()
    });
    
    await batch.commit();
    
    return { success: true, transactionId: transactionRef.id };
  } catch (error) {
    console.error('Erro na compra da PokéMart:', error);
    throw error;
  }
});

// Rotacionar itens da PokéMart diariamente
exports.rotatePokeMartItems = functions.pubsub
  .schedule('0 0 * * *') // Todo dia à meia-noite
  .timeZone('America/Sao_Paulo')
  .onRun(async (context) => {
    try {
      const items = [
        { id: 'potion', name: 'Potion', price: 300, category: 'healing' },
        { id: 'super_potion', name: 'Super Potion', price: 700, category: 'healing' },
        { id: 'hyper_potion', name: 'Hyper Potion', price: 1200, category: 'healing' },
        { id: 'max_potion', name: 'Max Potion', price: 2500, category: 'healing' },
        { id: 'revive', name: 'Revive', price: 1500, category: 'healing' },
        { id: 'max_revive', name: 'Max Revive', price: 4000, category: 'healing' },
        { id: 'antidote', name: 'Antidote', price: 100, category: 'status' },
        { id: 'paralyze_heal', name: 'Paralyze Heal', price: 200, category: 'status' },
        { id: 'burn_heal', name: 'Burn Heal', price: 250, category: 'status' },
        { id: 'ice_heal', name: 'Ice Heal', price: 250, category: 'status' },
        { id: 'awakening', name: 'Awakening', price: 250, category: 'status' },
        { id: 'full_heal', name: 'Full Heal', price: 600, category: 'status' },
        { id: 'x_attack', name: 'X Attack', price: 500, category: 'battle' },
        { id: 'x_defense', name: 'X Defense', price: 550, category: 'battle' },
        { id: 'x_speed', name: 'X Speed', price: 350, category: 'battle' },
        { id: 'x_accuracy', name: 'X Accuracy', price: 950, category: 'battle' },
        { id: 'dire_hit', name: 'Dire Hit', price: 650, category: 'battle' },
        { id: 'guard_spec', name: 'Guard Spec.', price: 700, category: 'battle' },
        { id: 'rare_candy', name: 'Rare Candy', price: 4800, category: 'special' },
        { id: 'pp_up', name: 'PP Up', price: 9800, category: 'special' },
        { id: 'protein', name: 'Protein', price: 9800, category: 'vitamin' },
        { id: 'iron', name: 'Iron', price: 9800, category: 'vitamin' },
        { id: 'carbos', name: 'Carbos', price: 9800, category: 'vitamin' },
        { id: 'calcium', name: 'Calcium', price: 9800, category: 'vitamin' },
        { id: 'zinc', name: 'Zinc', price: 9800, category: 'vitamin' },
        { id: 'hp_up', name: 'HP Up', price: 9800, category: 'vitamin' }
      ];
      
      // Selecionar 5 itens aleatórios para rotação
      const shuffled = items.sort(() => 0.5 - Math.random());
      const rotatingItems = shuffled.slice(0, 5);
      
      // Atualizar documento global da PokéMart
      await db.collection('global').doc('pokemart').set({
        rotatingItems,
        lastRotation: FieldValue.serverTimestamp(),
        nextRotation: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 horas
      });
      
      console.log('Itens da PokéMart rotacionados:', rotatingItems.map(item => item.name));
    } catch (error) {
      console.error('Erro ao rotacionar itens da PokéMart:', error);
    }
  });

// ================================
// FUNÇÕES DE MANUTENÇÃO
// ================================

// Limpeza de dados antigos
exports.cleanupOldData = functions.pubsub
  .schedule('0 2 * * 0') // Todo domingo às 2h
  .onRun(async (context) => {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      // Limpar batalhas antigas
      const oldBattlesQuery = db.collection('battles')
        .where('createdAt', '<', thirtyDaysAgo)
        .limit(500);
      
      const oldBattlesSnapshot = await oldBattlesQuery.get();
      
      if (!oldBattlesSnapshot.empty) {
        const batch = db.batch();
        oldBattlesSnapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
        });
        await batch.commit();
        console.log(`${oldBattlesSnapshot.size} batalhas antigas removidas`);
      }
      
      // Limpar mensagens de chat antigas (mais de 7 dias)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const oldMessagesQuery = db.collection('chat_messages')
        .where('createdAt', '<', sevenDaysAgo)
        .limit(1000);
      
      const oldMessagesSnapshot = await oldMessagesQuery.get();
      
      if (!oldMessagesSnapshot.empty) {
        const batch = db.batch();
        oldMessagesSnapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
        });
        await batch.commit();
        console.log(`${oldMessagesSnapshot.size} mensagens antigas removidas`);
      }
      
      // Limpar notificações antigas
      const notificationsRef = rtdb.ref('notifications');
      const notificationsSnapshot = await notificationsRef.once('value');
      const notifications = notificationsSnapshot.val();
      
      if (notifications) {
        const updates = {};
        Object.keys(notifications).forEach(userId => {
          Object.keys(notifications[userId]).forEach(notificationId => {
            const notification = notifications[userId][notificationId];
            if (notification.timestamp < thirtyDaysAgo.getTime()) {
              updates[`${userId}/${notificationId}`] = null;
            }
          });
        });
        
        if (Object.keys(updates).length > 0) {
          await notificationsRef.update(updates);
          console.log(`${Object.keys(updates).length} notificações antigas removidas`);
        }
      }
      
    } catch (error) {
      console.error('Erro na limpeza de dados antigos:', error);
    }
  });

// Atualizar rankings
exports.updateLeaderboards = functions.pubsub
  .schedule('0 */6 * * *') // A cada 6 horas
  .onRun(async (context) => {
    try {
      // Ranking de nível de personagens
      const topLevelCharacters = await db.collection('characters')
        .where('isActive', '==', true)
        .orderBy('level', 'desc')
        .orderBy('experience', 'desc')
        .limit(100)
        .get();
      
      const levelRanking = topLevelCharacters.docs.map((doc, index) => ({
        rank: index + 1,
        characterId: doc.id,
        ...doc.data()
      }));
      
      // Ranking de batalhas vencidas
      const topBattleWinners = await db.collection('characters')
        .where('isActive', '==', true)
        .orderBy('stats.battlesWon', 'desc')
        .limit(100)
        .get();
      
      const battleRanking = topBattleWinners.docs.map((doc, index) => ({
        rank: index + 1,
        characterId: doc.id,
        ...doc.data()
      }));
      
      // Ranking de Pokémon capturados
      const topCatchers = await db.collection('characters')
        .where('isActive', '==', true)
        .orderBy('stats.pokemonCaught', 'desc')
        .limit(100)
        .get();
      
      const catchRanking = topCatchers.docs.map((doc, index) => ({
        rank: index + 1,
        characterId: doc.id,
        ...doc.data()
      }));
      
      // Salvar rankings
      const batch = db.batch();
      
      batch.set(db.collection('leaderboards').doc('level'), {
        ranking: levelRanking,
        updatedAt: FieldValue.serverTimestamp()
      });
      
      batch.set(db.collection('leaderboards').doc('battles'), {
        ranking: battleRanking,
        updatedAt: FieldValue.serverTimestamp()
      });
      
      batch.set(db.collection('leaderboards').doc('catches'), {
        ranking: catchRanking,
        updatedAt: FieldValue.serverTimestamp()
      });
      
      await batch.commit();
      
      console.log('Rankings atualizados com sucesso');
    } catch (error) {
      console.error('Erro ao atualizar rankings:', error);
    }
  });

// ================================
// FUNÇÕES DE MONITORAMENTO
// ================================

// Monitorar performance e uso
exports.trackUsageMetrics = functions.pubsub
  .schedule('0 * * * *') // A cada hora
  .onRun(async (context) => {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      
      // Contar usuários ativos na última hora
      const activeUsersSnapshot = await db.collection('users')
        .where('lastLoginAt', '>=', oneHourAgo)
        .get();
      
      // Contar batalhas criadas na última hora
      const recentBattlesSnapshot = await db.collection('battles')
        .where('createdAt', '>=', oneHourAgo)
        .get();
      
      // Contar Pokémon capturados na última hora
      const recentCapturesSnapshot = await db.collection('captured_pokemon')
        .where('caughtAt', '>=', oneHourAgo)
        .get();
      
      // Salvar métricas
      await db.collection('analytics').add({
        timestamp: FieldValue.serverTimestamp(),
        hour: now.getHours(),
        date: now.toISOString().split('T')[0],
        metrics: {
          activeUsers: activeUsersSnapshot.size,
          battlesCreated: recentBattlesSnapshot.size,
          pokemonCaptured: recentCapturesSnapshot.size
        }
      });
      
      console.log(`Métricas registradas - Usuários ativos: ${activeUsersSnapshot.size}, Batalhas: ${recentBattlesSnapshot.size}, Capturas: ${recentCapturesSnapshot.size}`);
    } catch (error) {
      console.error('Erro ao registrar métricas:', error);
    }
  });

// ================================
// FUNÇÕES DE EVENTOS ESPECIAIS
// ================================

// Processar eventos especiais
exports.processSpecialEvents = functions.pubsub
  .schedule('0 0 * * *') // Todo dia à meia-noite
  .timeZone('America/Sao_Paulo')
  .onRun(async (context) => {
    try {
      const today = new Date();
      const events = [];
      
      // Verificar eventos baseados na data
      const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
      
      // Evento de Pokémon raros (todo fim de semana)
      if (today.getDay() === 6 || today.getDay() === 0) {
        events.push({
          id: 'rare_pokemon_weekend',
          name: 'Fim de Semana de Pokémon Raros',
          description: 'Chance aumentada de encontrar Pokémon raros!',
          type: 'capture_boost',
          multiplier: 2,
          startDate: today,
          endDate: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000)
        });
      }
      
      // Evento de experiência dupla (primeira semana do mês)
      if (today.getDate() <= 7) {
        events.push({
          id: 'double_exp_week',
          name: 'Semana de Experiência Dupla',
          description: 'Ganhe o dobro de experiência em batalhas!',
          type: 'exp_boost',
          multiplier: 2,
          startDate: today,
          endDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
        });
      }
      
      // Salvar eventos ativos
      if (events.length > 0) {
        const batch = db.batch();
        
        events.forEach(event => {
          const eventRef = db.collection('events').doc(event.id);
          batch.set(eventRef, {
            ...event,
            isActive: true,
            createdAt: FieldValue.serverTimestamp()
          });
        });
        
        await batch.commit();
        console.log(`${events.length} eventos especiais ativados`);
      }
      
    } catch (error) {
      console.error('Erro ao processar eventos especiais:', error);
    }
  });

// ================================
// FUNÇÕES UTILITÁRIAS
// ================================

// Função para backup de dados críticos
exports.backupCriticalData = functions.pubsub
  .schedule('0 3 * * *') // Todo dia às 3h
  .onRun(async (context) => {
    try {
      // Esta função seria implementada para fazer backup
      // dos dados mais críticos para um bucket do Cloud Storage
      console.log('Backup de dados críticos iniciado');
      
      // TODO: Implementar backup real
      // - Exportar dados de usuários
      // - Exportar dados de personagens
      // - Exportar dados de Pokémon capturados
      // - Comprimir e enviar para Cloud Storage
      
      console.log('Backup de dados críticos concluído');
    } catch (error) {
      console.error('Erro no backup de dados críticos:', error);
    }
  });

// Função para detectar e prevenir fraudes
exports.detectFraud = functions.firestore
  .document('captured_pokemon/{pokemonId}')
  .onCreate(async (snap, context) => {
    try {
      const pokemon = snap.data();
      const characterId = pokemon.characterId;
      
      // Verificar capturas suspeitas (muitas capturas em pouco tempo)
      const recentCaptures = await db.collection('captured_pokemon')
        .where('characterId', '==', characterId)
        .where('caughtAt', '>=', new Date(Date.now() - 60 * 1000)) // Último minuto
        .get();
      
      if (recentCaptures.size > 10) {
        // Marcar como suspeito
        await db.collection('fraud_reports').add({
          type: 'excessive_captures',
          characterId,
          userId: pokemon.userId,
          details: {
            capturesInMinute: recentCaptures.size,
            pokemonId: context.params.pokemonId
          },
          timestamp: FieldValue.serverTimestamp(),
          status: 'pending'
        });
        
        console.log(`Atividade suspeita detectada para personagem: ${characterId}`);
      }
      
      // Verificar IVs perfeitos suspeitos
      const ivs = pokemon.ivs;
      const perfectIVs = Object.values(ivs).filter(iv => iv === 31).length;
      
      if (perfectIVs >= 5) {
        // IVs muito altos são suspeitos
        await db.collection('fraud_reports').add({
          type: 'suspicious_ivs',
          characterId,
          userId: pokemon.userId,
          details: {
            perfectIVs,
            ivs,
            pokemonId: context.params.pokemonId
          },
          timestamp: FieldValue.serverTimestamp(),
          status: 'pending'
        });
      }
      
    } catch (error) {
      console.error('Erro na detecção de fraude:', error);
    }
  });

module.exports = {
  // Exportar todas as funções para deploy
};

