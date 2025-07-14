import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { characterService, Character } from '../services/CharacterService';
import { Colors } from '../utils/Colors';

interface HomeScreenProps {
  navigation: any;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, logout } = useAuth();

  useFocusEffect(
    useCallback(() => {
      loadCharacters();
    }, [user])
  );

  const loadCharacters = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const userCharacters = await characterService.getCharacters(user.id);
      setCharacters(userCharacters);
      
      // Se não tem personagens, vai direto para criação
      if (userCharacters.length === 0) {
        navigation.navigate('CreateCharacter');
      }
    } catch (error) {
      console.error('Erro ao carregar personagens:', error);
      Alert.alert('Erro', 'Erro ao carregar personagens');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectCharacter = (character: Character) => {
    Alert.alert(
      character.name,
      `Classe: ${character.class}\nOrigem: ${character.origin}\nNível: ${character.level}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Jogar', 
          onPress: () => {
            // Navegar para o jogo principal com este personagem
            Alert.alert('Em breve', 'Funcionalidade do jogo será implementada em breve!');
          }
        },
      ]
    );
  };

  const handleCreateNewCharacter = () => {
    if (!user?.isVip && characters.length >= 1) {
      Alert.alert(
        'Limite Atingido',
        'Usuários gratuitos podem ter apenas 1 personagem. Torne-se VIP para criar mais personagens!',
        [
          { text: 'OK', style: 'cancel' },
          { text: 'Ser VIP', onPress: () => Alert.alert('Em breve', 'Sistema VIP será implementado em breve!') },
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
        { text: 'Sair', onPress: logout },
      ]
    );
  };

  const renderCharacterCard = ({ item }: { item: Character }) => (
    <TouchableOpacity
      style={styles.characterCard}
      onPress={() => handleSelectCharacter(item)}
    >
      <View style={styles.characterHeader}>
        <View style={styles.characterInfo}>
          <Text style={styles.characterName}>{item.name}</Text>
          <Text style={styles.characterClass}>{item.class}</Text>
          <Text style={styles.characterOrigin}>{item.origin}</Text>
        </View>
        <View style={styles.characterLevel}>
          <Text style={styles.levelText}>Nv. {item.level}</Text>
        </View>
      </View>
      
      <View style={styles.starterInfo}>
        <Text style={styles.starterLabel}>Pokémon Inicial:</Text>
        <Text style={styles.starterName}>
          {item.starterPokemonName} {item.starterIsShiny ? '✨' : ''}
        </Text>
        <Text style={styles.starterGender}>
          {item.starterPokemonGender === 'Masculino' ? '♂' : '♀'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Carregando personagens...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Bem-vindo,</Text>
          <Text style={styles.userName}>{user?.name}</Text>
          {user?.isVip && (
            <Text style={styles.vipBadge}>⭐ VIP</Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>
      </View>

      {/* Lista de Personagens */}
      <View style={styles.content}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Seus Personagens</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleCreateNewCharacter}
          >
            <Text style={styles.addButtonText}>+ Novo</Text>
          </TouchableOpacity>
        </View>

        {characters.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>Nenhum personagem criado</Text>
            <Text style={styles.emptyText}>
              Crie seu primeiro personagem para começar sua jornada Pokémon!
            </Text>
            <TouchableOpacity
              style={styles.createFirstButton}
              onPress={() => navigation.navigate('CreateCharacter')}
            >
              <Text style={styles.createFirstButtonText}>Criar Personagem</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={characters}
            renderItem={renderCharacterCard}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.grayLight,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.grayLight,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.gray,
    marginTop: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: Colors.primary,
  },
  welcomeText: {
    fontSize: 16,
    color: Colors.white,
    opacity: 0.9,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
  },
  vipBadge: {
    fontSize: 14,
    color: Colors.secondary,
    fontWeight: 'bold',
    marginTop: 2,
  },
  logoutButton: {
    backgroundColor: Colors.primaryDark,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutText: {
    color: Colors.white,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.black,
  },
  addButton: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: Colors.white,
    fontWeight: '600',
  },
  listContainer: {
    paddingBottom: 20,
  },
  characterCard: {
    backgroundColor: Colors.white,
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  characterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  characterInfo: {
    flex: 1,
  },
  characterName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.black,
    marginBottom: 5,
  },
  characterClass: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
    marginBottom: 2,
  },
  characterOrigin: {
    fontSize: 14,
    color: Colors.gray,
  },
  characterLevel: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  levelText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.black,
  },
  starterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: Colors.grayLight,
  },
  starterLabel: {
    fontSize: 14,
    color: Colors.gray,
    marginRight: 8,
  },
  starterName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.accent,
    textTransform: 'capitalize',
    marginRight: 8,
  },
  starterGender: {
    fontSize: 18,
    color: Colors.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.black,
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: Colors.gray,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  createFirstButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  createFirstButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default HomeScreen;

