import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  Image,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../services/AuthContext';
import { CharacterService } from '../services/CharacterService';
import { Colors } from '../styles/Colors';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user, logout } = useAuth();

  useEffect(() => {
    loadCharacters();
  }, []);

  const loadCharacters = async () => {
    try {
      setLoading(true);
      const userCharacters = await CharacterService.getUserCharacters();
      setCharacters(userCharacters);
      
      // Se não tem personagens, redireciona para criação
      if (userCharacters.length === 0) {
        navigation.navigate('CreateCharacter');
      }
    } catch (error) {
      console.error('Erro ao carregar personagens:', error);
      Alert.alert('Erro', 'Falha ao carregar personagens');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCharacters();
    setRefreshing(false);
  };

  const handleCharacterPress = (character) => {
    navigation.navigate('CharacterProfile', { character });
  };

  const handleCreateCharacter = () => {
    // Verificar se é VIP para permitir múltiplos personagens
    if (characters.length > 0 && !user?.isVip) {
      Alert.alert(
        'Limite Atingido',
        'Usuários gratuitos podem ter apenas 1 personagem. Torne-se VIP para criar mais personagens!',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Ser VIP', onPress: () => navigation.navigate('VipUpgrade') }
        ]
      );
      return;
    }
    
    navigation.navigate('CreateCharacter');
  };

  const handleLogout = () => {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', onPress: logout }
      ]
    );
  };

  const renderCharacterCard = ({ item: character }) => (
    <TouchableOpacity
      style={styles.characterCard}
      onPress={() => handleCharacterPress(character)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.characterInfo}>
          <Text style={styles.characterName}>{character.name}</Text>
          <Text style={styles.characterClass}>{character.class}</Text>
          <Text style={styles.characterOrigin}>{character.origin}</Text>
        </View>
        
        {character.avatar && (
          <Image source={{ uri: character.avatar }} style={styles.characterAvatar} />
        )}
      </View>

      <View style={styles.cardBody}>
        <View style={styles.starterPokemonContainer}>
          <Image
            source={{ uri: character.starterPokemon?.imageUrl }}
            style={styles.starterPokemonImage}
          />
          <View style={styles.starterPokemonInfo}>
            <Text style={styles.starterPokemonName}>
              {character.starterPokemon?.name}
            </Text>
            <Text style={styles.starterPokemonLevel}>
              Nível {character.starterPokemon?.level || 5}
            </Text>
          </View>
        </View>

        <View style={styles.characterStats}>
          <View style={styles.statItem}>
            <Icon name="catching-pokemon" size={16} color={Colors.primary} />
            <Text style={styles.statText}>{character.pokemonCount || 1}</Text>
          </View>
          <View style={styles.statItem}>
            <Icon name="emoji-events" size={16} color={Colors.secondary} />
            <Text style={styles.statText}>{character.badges || 0}</Text>
          </View>
          <View style={styles.statItem}>
            <Icon name="star" size={16} color={Colors.accent} />
            <Text style={styles.statText}>{character.fame || 0}</Text>
          </View>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.lastPlayedText}>
          Última vez: {new Date(character.lastPlayed).toLocaleDateString()}
        </Text>
        <Icon name="chevron-right" size={24} color={Colors.gray} />
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Icon name="catching-pokemon" size={80} color={Colors.gray} />
      </View>
      <Text style={styles.emptyTitle}>Nenhum Personagem</Text>
      <Text style={styles.emptyDescription}>
        Crie seu primeiro personagem e comece sua jornada Pokémon!
      </Text>
      <TouchableOpacity
        style={styles.createFirstCharacterButton}
        onPress={handleCreateCharacter}
      >
        <Icon name="add" size={24} color={Colors.white} />
        <Text style={styles.createFirstCharacterText}>CRIAR PERSONAGEM</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.secondary} />
          <Text style={styles.loadingText}>Carregando personagens...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.welcomeText}>Olá, {user?.displayName || user?.email}!</Text>
          <Text style={styles.subtitleText}>Escolha seu personagem</Text>
        </View>
        
        <View style={styles.headerRight}>
          {user?.isVip && (
            <View style={styles.vipBadge}>
              <Icon name="star" size={16} color={Colors.secondary} />
              <Text style={styles.vipText}>VIP</Text>
            </View>
          )}
          
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Icon name="logout" size={24} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {characters.length === 0 ? (
          renderEmptyState()
        ) : (
          <>
            <FlatList
              data={characters}
              renderItem={renderCharacterCard}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={[Colors.primary]}
                  tintColor={Colors.primary}
                />
              }
              contentContainerStyle={styles.charactersList}
            />

            {/* Floating Action Button */}
            <TouchableOpacity
              style={styles.fab}
              onPress={handleCreateCharacter}
            >
              <Icon name="add" size={28} color={Colors.white} />
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary,
  },
  loadingText: {
    color: Colors.white,
    fontSize: 16,
    marginTop: 20,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: Colors.primary,
  },
  headerLeft: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.white,
  },
  subtitleText: {
    fontSize: 14,
    color: Colors.white,
    opacity: 0.8,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  vipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.black,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  vipText: {
    color: Colors.secondary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  logoutButton: {
    padding: 8,
  },

  // Content
  content: {
    flex: 1,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingTop: 20,
  },
  charactersList: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },

  // Character Card
  characterCard: {
    backgroundColor: Colors.white,
    borderRadius: 15,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: Colors.gray,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: Colors.primary,
  },
  characterInfo: {
    flex: 1,
  },
  characterName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.white,
  },
  characterClass: {
    fontSize: 14,
    color: Colors.secondary,
    marginTop: 2,
  },
  characterOrigin: {
    fontSize: 12,
    color: Colors.white,
    opacity: 0.8,
    marginTop: 1,
  },
  characterAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: Colors.white,
  },

  cardBody: {
    padding: 15,
  },
  starterPokemonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  starterPokemonImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  starterPokemonInfo: {
    flex: 1,
  },
  starterPokemonName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.black,
  },
  starterPokemonLevel: {
    fontSize: 14,
    color: Colors.gray,
    marginTop: 2,
  },

  characterStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: Colors.gray,
    opacity: 0.3,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.black,
  },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: Colors.gray,
    opacity: 0.1,
  },
  lastPlayedText: {
    fontSize: 12,
    color: Colors.gray,
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.gray,
    opacity: 0.1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.black,
    marginBottom: 10,
  },
  emptyDescription: {
    fontSize: 16,
    color: Colors.gray,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
  },
  createFirstCharacterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    gap: 10,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  createFirstCharacterText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Floating Action Button
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
});

export default HomeScreen;

