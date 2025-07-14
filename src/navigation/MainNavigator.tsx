import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/HomeScreen';
// import CreateCharacterScreen from '../screens/CreateCharacterScreen';
// import GameScreen from '../screens/GameScreen';

export type MainStackParamList = {
  Home: undefined;
  CreateCharacter: undefined;
  Game: { characterId: string };
};

const Stack = createStackNavigator<MainStackParamList>();

const MainNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="Home"
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
      <Stack.Screen name="Home" component={HomeScreen} />
      {/* 
      Telas que serão implementadas nas próximas fases:
      <Stack.Screen name="CreateCharacter" component={CreateCharacterScreen} />
      <Stack.Screen name="Game" component={GameScreen} />
      */}
    </Stack.Navigator>
  );
};

export default MainNavigator;

