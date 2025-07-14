import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../styles/Colors';

// Screens
import HomeScreen from '../screens/HomeScreen';
import CreateCharacterScreen from '../screens/CreateCharacterScreen';
import CharacterProfileScreen from '../screens/CharacterProfileScreen';
import PokedexScreen from '../screens/PokedexScreen';
import BattleScreen from '../screens/BattleScreen';
import PokemartScreen from '../screens/PokemartScreen';
import PokemonCenterScreen from '../screens/PokemonCenterScreen';
import FriendsScreen from '../screens/FriendsScreen';
import CatchPokemonScreen from '../screens/CatchPokemonScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Tab Navigator para as telas principais
const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Home':
              iconName = 'home';
              break;
            case 'Pokedex':
              iconName = 'book';
              break;
            case 'Battle':
              iconName = 'sports-martial-arts';
              break;
            case 'Friends':
              iconName = 'people';
              break;
            default:
              iconName = 'circle';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.gray,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopWidth: 2,
          borderTopColor: Colors.gray,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          title: 'Início'
        }}
      />
      <Tab.Screen 
        name="Pokedex" 
        component={PokedexScreen}
        options={{
          title: 'Pokédex'
        }}
      />
      <Tab.Screen 
        name="Battle" 
        component={BattleScreen}
        options={{
          title: 'Batalha'
        }}
      />
      <Tab.Screen 
        name="Friends" 
        component={FriendsScreen}
        options={{
          title: 'Amigos'
        }}
      />
    </Tab.Navigator>
  );
};

// Stack Navigator principal
const MainNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: 'transparent' },
        cardStyleInterpolator: ({ current, layouts }) => {
          return {
            cardStyle: {
              transform: [
                {
                  translateX: current.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [layouts.screen.width, 0],
                  }),
                },
              ],
            },
          };
        },
      }}
    >
      {/* Tab Navigator como tela principal */}
      <Stack.Screen 
        name="MainTabs" 
        component={TabNavigator}
      />
      
      {/* Telas de personagem */}
      <Stack.Screen 
        name="CreateCharacter" 
        component={CreateCharacterScreen}
        options={{
          title: 'Criar Personagem'
        }}
      />
      <Stack.Screen 
        name="CharacterProfile" 
        component={CharacterProfileScreen}
        options={{
          title: 'Perfil do Personagem'
        }}
      />
      
      {/* Telas de gameplay */}
      <Stack.Screen 
        name="CatchPokemon" 
        component={CatchPokemonScreen}
        options={{
          title: 'Capturar Pokémon'
        }}
      />
      <Stack.Screen 
        name="Pokemart" 
        component={PokemartScreen}
        options={{
          title: 'PokéMart'
        }}
      />
      <Stack.Screen 
        name="PokemonCenter" 
        component={PokemonCenterScreen}
        options={{
          title: 'Centro Pokémon'
        }}
      />
    </Stack.Navigator>
  );
};

export default MainNavigator;

