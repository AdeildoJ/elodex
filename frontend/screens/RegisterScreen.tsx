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

const { width } = Dimensions.get('window');

const RegisterScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  const { register, loginWithGoogle, loginWithFacebook } = useAuth();

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

  const validateForm = () => {
    const { fullName, email, password, confirmPassword } = formData;

    if (!fullName.trim()) {
      Alert.alert('Erro', 'Nome completo é obrigatório');
      return false;
    }

    if (fullName.trim().length < 3) {
      Alert.alert('Erro', 'Nome deve ter pelo menos 3 caracteres');
      return false;
    }

    if (!email.trim()) {
      Alert.alert('Erro', 'Email é obrigatório');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Erro', 'Email inválido');
      return false;
    }

    if (!password) {
      Alert.alert('Erro', 'Senha é obrigatória');
      return false;
    }

    if (password.length < 6) {
      Alert.alert('Erro', 'Senha deve ter pelo menos 6 caracteres');
      return false;
    }

    // Validação de senha forte
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      Alert.alert(
        'Senha Fraca',
        'A senha deve conter:\n• Pelo menos 1 letra maiúscula\n• Pelo menos 1 letra minúscula\n• Pelo menos 1 número\n• Pelo menos 1 caractere especial'
      );
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert('Erro', 'As senhas não coincidem');
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await register(
        formData.email.trim(),
        formData.password,
        formData.fullName.trim()
      );
      
      Alert.alert(
        'Sucesso!',
        'Conta criada com sucesso! Você pode fazer login agora.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login')
          }
        ]
      );
    } catch (error) {
      Alert.alert('Erro no Registro', error.message || 'Falha ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialRegister = async (provider) => {
    setLoading(true);
    try {
      if (provider === 'google') {
        await loginWithGoogle();
      } else if (provider === 'facebook') {
        await loginWithFacebook();
      }
      // Navegação será tratada pelo AuthContext
    } catch (error) {
      Alert.alert('Erro no Registro Social', error.message || 'Falha na autenticação');
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      
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
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Icon name="arrow-back" size={24} color={Colors.white} />
              </TouchableOpacity>
              
              <View style={styles.pokedexFrame}>
                <View style={styles.pokedexScreen}>
                  <Text style={styles.screenTitle}>Novo Treinador</Text>
                  <Text style={styles.screenSubtitle}>Registre-se no EloDex</Text>
                </View>
                
                <View style={styles.lightsContainer}>
                  <View style={[styles.light, styles.lightRed]} />
                  <View style={[styles.light, styles.lightYellow]} />
                  <View style={[styles.light, styles.lightBlue]} />
                </View>
              </View>
            </View>

            {/* Formulário de Registro */}
            <View style={styles.formContainer}>
              <View style={styles.formFrame}>
                <Text style={styles.formTitle}>Criar Conta</Text>
                
                {/* Campo Nome Completo */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Nome Completo *</Text>
                  <View style={styles.inputWrapper}>
                    <Icon name="person" size={20} color={Colors.gray} style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      value={formData.fullName}
                      onChangeText={(value) => updateFormData('fullName', value)}
                      placeholder="Digite seu nome completo"
                      placeholderTextColor={Colors.gray}
                      autoCapitalize="words"
                      autoCorrect={false}
                    />
                  </View>
                </View>

                {/* Campo Email */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Email *</Text>
                  <View style={styles.inputWrapper}>
                    <Icon name="email" size={20} color={Colors.gray} style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      value={formData.email}
                      onChangeText={(value) => updateFormData('email', value)}
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
                  <Text style={styles.inputLabel}>Senha *</Text>
                  <View style={styles.inputWrapper}>
                    <Icon name="lock" size={20} color={Colors.gray} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.textInput, styles.passwordInput]}
                      value={formData.password}
                      onChangeText={(value) => updateFormData('password', value)}
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
                  <Text style={styles.passwordHint}>
                    Deve conter: maiúscula, minúscula, número e símbolo
                  </Text>
                </View>

                {/* Campo Confirmar Senha */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Confirmar Senha *</Text>
                  <View style={styles.inputWrapper}>
                    <Icon name="lock-outline" size={20} color={Colors.gray} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.textInput, styles.passwordInput]}
                      value={formData.confirmPassword}
                      onChangeText={(value) => updateFormData('confirmPassword', value)}
                      placeholder="Confirme sua senha"
                      placeholderTextColor={Colors.gray}
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <TouchableOpacity
                      style={styles.eyeButton}
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      <Icon
                        name={showConfirmPassword ? 'visibility' : 'visibility-off'}
                        size={20}
                        color={Colors.gray}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Botão Registrar */}
                <TouchableOpacity
                  style={[styles.registerButton, loading && styles.buttonDisabled]}
                  onPress={handleRegister}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={Colors.white} size="small" />
                  ) : (
                    <Text style={styles.registerButtonText}>CRIAR CONTA</Text>
                  )}
                </TouchableOpacity>

                {/* Divisor */}
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>ou registre-se com</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Botões de Registro Social */}
                <View style={styles.socialContainer}>
                  <TouchableOpacity
                    style={[styles.socialButton, styles.googleButton]}
                    onPress={() => handleSocialRegister('google')}
                    disabled={loading}
                  >
                    <Icon name="google" size={20} color={Colors.white} />
                    <Text style={styles.socialButtonText}>Google</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.socialButton, styles.facebookButton]}
                    onPress={() => handleSocialRegister('facebook')}
                    disabled={loading}
                  >
                    <Icon name="facebook" size={20} color={Colors.white} />
                    <Text style={styles.socialButtonText}>Facebook</Text>
                  </TouchableOpacity>
                </View>

                {/* Link para Login */}
                <View style={styles.loginLinkContainer}>
                  <Text style={styles.loginLinkText}>Já tem uma conta? </Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                    <Text style={styles.loginLink}>Fazer Login</Text>
                  </TouchableOpacity>
                </View>
              </View>
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
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  content: {
    flex: 1,
  },
  
  // Header
  header: {
    alignItems: 'center',
    marginBottom: 30,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 20,
    zIndex: 1,
    padding: 10,
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
  },
  pokedexScreen: {
    backgroundColor: Colors.black,
    borderRadius: 10,
    padding: 15,
    borderWidth: 2,
    borderColor: Colors.gray,
    alignItems: 'center',
    minWidth: width * 0.6,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.secondary,
    textAlign: 'center',
  },
  screenSubtitle: {
    fontSize: 12,
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
    marginBottom: 20,
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
  passwordHint: {
    fontSize: 12,
    color: Colors.gray,
    marginTop: 5,
    fontStyle: 'italic',
  },

  // Botões
  registerButton: {
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
  registerButtonText: {
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
    fontSize: 12,
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

  // Link para Login
  loginLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginLinkText: {
    color: Colors.gray,
    fontSize: 14,
  },
  loginLink: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default RegisterScreen;

