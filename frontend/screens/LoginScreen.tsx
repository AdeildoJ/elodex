import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Dimensions,
  StatusBar,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../services/AuthContext';
import { Colors } from '../styles/Colors';

const { width, height } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  const { login, loginWithGoogle, loginWithFacebook } = useAuth();

  useEffect(() => {
    // Animação de entrada
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
      // Navegação será tratada pelo AuthContext
    } catch (error) {
      Alert.alert('Erro no Login', error.message || 'Falha na autenticação');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider) => {
    setLoading(true);
    try {
      if (provider === 'google') {
        await loginWithGoogle();
      } else if (provider === 'facebook') {
        await loginWithFacebook();
      }
    } catch (error) {
      Alert.alert('Erro no Login Social', error.message || 'Falha na autenticação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      
      {/* Background com gradiente simulado */}
      <View style={styles.backgroundGradient} />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Header com logo estilo Pokédex */}
            <View style={styles.header}>
              <View style={styles.pokedexFrame}>
                <View style={styles.pokedexScreen}>
                  <Text style={styles.appTitle}>EloDex</Text>
                  <Text style={styles.appSubtitle}>Pokédex Digital</Text>
                </View>
                
                {/* Luzes da Pokédex */}
                <View style={styles.lightsContainer}>
                  <View style={[styles.light, styles.lightRed]} />
                  <View style={[styles.light, styles.lightYellow]} />
                  <View style={[styles.light, styles.lightBlue]} />
                </View>
              </View>
            </View>

            {/* Formulário de Login */}
            <View style={styles.formContainer}>
              <View style={styles.formFrame}>
                <Text style={styles.formTitle}>Acesso de Treinador</Text>
                
                {/* Campo Email */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Email ou Usuário</Text>
                  <View style={styles.inputWrapper}>
                    <Icon name="person" size={20} color={Colors.gray} style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      value={email}
                      onChangeText={setEmail}
                      placeholder="Digite seu email"
                      placeholderTextColor={Colors.gray}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                </View>

                {/* Campo Senha */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Senha</Text>
                  <View style={styles.inputWrapper}>
                    <Icon name="lock" size={20} color={Colors.gray} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.textInput, styles.passwordInput]}
                      value={password}
                      onChangeText={setPassword}
                      placeholder="Digite sua senha"
                      placeholderTextColor={Colors.gray}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <TouchableOpacity
                      style={styles.eyeButton}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Icon
                        name={showPassword ? 'visibility' : 'visibility-off'}
                        size={20}
                        color={Colors.gray}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Botão Entrar */}
                <TouchableOpacity
                  style={[styles.loginButton, loading && styles.buttonDisabled]}
                  onPress={handleLogin}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={Colors.white} size="small" />
                  ) : (
                    <Text style={styles.loginButtonText}>ENTRAR</Text>
                  )}
                </TouchableOpacity>

                {/* Divisor */}
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>ou</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Botões de Login Social */}
                <View style={styles.socialContainer}>
                  <TouchableOpacity
                    style={[styles.socialButton, styles.googleButton]}
                    onPress={() => handleSocialLogin('google')}
                    disabled={loading}
                  >
                    <Icon name="google" size={20} color={Colors.white} />
                    <Text style={styles.socialButtonText}>Google</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.socialButton, styles.facebookButton]}
                    onPress={() => handleSocialLogin('facebook')}
                    disabled={loading}
                  >
                    <Icon name="facebook" size={20} color={Colors.white} />
                    <Text style={styles.socialButtonText}>Facebook</Text>
                  </TouchableOpacity>
                </View>

                {/* Links de Ação */}
                <View style={styles.actionsContainer}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => navigation.navigate('Register')}
                  >
                    <Text style={styles.actionButtonText}>REGISTRAR-SE</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => navigation.navigate('ForgotPassword')}
                  >
                    <Text style={styles.actionButtonText}>RECUPERAR SENHA</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Versão 1.0.0 • Desenvolvido para Treinadores Pokémon
              </Text>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.primary,
    opacity: 0.9,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  
  // Header - Estilo Pokédex
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  pokedexFrame: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    padding: 20,
    borderWidth: 4,
    borderColor: Colors.black,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 15,
    position: 'relative',
  },
  pokedexScreen: {
    backgroundColor: Colors.black,
    borderRadius: 10,
    padding: 20,
    borderWidth: 2,
    borderColor: Colors.gray,
    alignItems: 'center',
    minWidth: width * 0.7,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.secondary,
    textAlign: 'center',
    textShadowColor: Colors.black,
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  appSubtitle: {
    fontSize: 14,
    color: Colors.white,
    textAlign: 'center',
    marginTop: 5,
    opacity: 0.8,
  },
  lightsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 15,
    gap: 10,
  },
  light: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.black,
  },
  lightRed: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 5,
  },
  lightYellow: {
    backgroundColor: Colors.secondary,
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 5,
  },
  lightBlue: {
    backgroundColor: Colors.accent,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 5,
  },

  // Formulário
  formContainer: {
    marginBottom: 30,
  },
  formFrame: {
    backgroundColor: Colors.white,
    borderRadius: 15,
    padding: 25,
    borderWidth: 3,
    borderColor: Colors.black,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.black,
    textAlign: 'center',
    marginBottom: 25,
  },

  // Inputs
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.gray,
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.black,
    paddingVertical: 0,
  },
  passwordInput: {
    paddingRight: 40,
  },
  eyeButton: {
    position: 'absolute',
    right: 15,
    padding: 5,
  },

  // Botões
  loginButton: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 2,
    borderColor: Colors.black,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Divisor
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 25,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.gray,
    opacity: 0.5,
  },
  dividerText: {
    marginHorizontal: 15,
    color: Colors.gray,
    fontSize: 14,
  },

  // Login Social
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
    marginBottom: 25,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 45,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.black,
    gap: 8,
  },
  googleButton: {
    backgroundColor: '#DB4437',
  },
  facebookButton: {
    backgroundColor: '#4267B2',
  },
  socialButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },

  // Ações
  actionsContainer: {
    gap: 15,
  },
  actionButton: {
    backgroundColor: Colors.secondary,
    borderRadius: 8,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.black,
  },
  actionButtonText: {
    color: Colors.black,
    fontSize: 14,
    fontWeight: 'bold',
  },

  // Footer
  footer: {
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    color: Colors.white,
    fontSize: 12,
    opacity: 0.7,
    textAlign: 'center',
  },
});

export default LoginScreen;

