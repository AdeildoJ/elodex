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

const ForgotPasswordScreen = ({ navigation }) => {
  const [step, setStep] = useState(1); // 1: Email, 2: Código, 3: Nova Senha
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  const { sendPasswordResetEmail, verifyPasswordResetCode, resetPassword } = useAuth();

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

  const handleSendCode = async () => {
    if (!email.trim()) {
      Alert.alert('Erro', 'Por favor, digite seu email');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Erro', 'Email inválido');
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(email.trim());
      Alert.alert(
        'Código Enviado!',
        'Verifique seu email e digite o código de verificação abaixo.',
        [{ text: 'OK', onPress: () => setStep(2) }]
      );
    } catch (error) {
      Alert.alert('Erro', error.message || 'Falha ao enviar código');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      Alert.alert('Erro', 'Por favor, digite o código de verificação');
      return;
    }

    if (verificationCode.length !== 6) {
      Alert.alert('Erro', 'O código deve ter 6 dígitos');
      return;
    }

    setLoading(true);
    try {
      await verifyPasswordResetCode(verificationCode.trim());
      setStep(3);
    } catch (error) {
      Alert.alert('Erro', error.message || 'Código inválido ou expirado');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword) {
      Alert.alert('Erro', 'Por favor, digite a nova senha');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Erro', 'A senha deve ter pelo menos 6 caracteres');
      return;
    }

    // Validação de senha forte
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumbers = /\d/.test(newPassword);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      Alert.alert(
        'Senha Fraca',
        'A senha deve conter:\n• Pelo menos 1 letra maiúscula\n• Pelo menos 1 letra minúscula\n• Pelo menos 1 número\n• Pelo menos 1 caractere especial'
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Erro', 'As senhas não coincidem');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(verificationCode, newPassword);
      Alert.alert(
        'Sucesso!',
        'Sua senha foi alterada com sucesso. Você pode fazer login agora.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login')
          }
        ]
      );
    } catch (error) {
      Alert.alert('Erro', error.message || 'Falha ao alterar senha');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <>
            <Text style={styles.stepDescription}>
              Digite seu email para receber o código de verificação
            </Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <View style={styles.inputWrapper}>
                <Icon name="email" size={20} color={Colors.gray} style={styles.inputIcon} />
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

            <TouchableOpacity
              style={[styles.actionButton, loading && styles.buttonDisabled]}
              onPress={handleSendCode}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Colors.white} size="small" />
              ) : (
                <Text style={styles.actionButtonText}>ENVIAR CÓDIGO</Text>
              )}
            </TouchableOpacity>
          </>
        );

      case 2:
        return (
          <>
            <Text style={styles.stepDescription}>
              Digite o código de 6 dígitos enviado para {email}
            </Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Código de Verificação</Text>
              <View style={styles.inputWrapper}>
                <Icon name="security" size={20} color={Colors.gray} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={verificationCode}
                  onChangeText={setVerificationCode}
                  placeholder="000000"
                  placeholderTextColor={Colors.gray}
                  keyboardType="numeric"
                  maxLength={6}
                  autoCorrect={false}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.actionButton, loading && styles.buttonDisabled]}
              onPress={handleVerifyCode}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Colors.white} size="small" />
              ) : (
                <Text style={styles.actionButtonText}>VERIFICAR CÓDIGO</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resendButton}
              onPress={() => setStep(1)}
            >
              <Text style={styles.resendButtonText}>Reenviar código</Text>
            </TouchableOpacity>
          </>
        );

      case 3:
        return (
          <>
            <Text style={styles.stepDescription}>
              Digite sua nova senha
            </Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Nova Senha</Text>
              <View style={styles.inputWrapper}>
                <Icon name="lock" size={20} color={Colors.gray} style={styles.inputIcon} />
                <TextInput
                  style={[styles.textInput, styles.passwordInput]}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Digite sua nova senha"
                  placeholderTextColor={Colors.gray}
                  secureTextEntry={!showNewPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowNewPassword(!showNewPassword)}
                >
                  <Icon
                    name={showNewPassword ? 'visibility' : 'visibility-off'}
                    size={20}
                    color={Colors.gray}
                  />
                </TouchableOpacity>
              </View>
              <Text style={styles.passwordHint}>
                Deve conter: maiúscula, minúscula, número e símbolo
              </Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Confirmar Nova Senha</Text>
              <View style={styles.inputWrapper}>
                <Icon name="lock-outline" size={20} color={Colors.gray} style={styles.inputIcon} />
                <TextInput
                  style={[styles.textInput, styles.passwordInput]}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirme sua nova senha"
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

            <TouchableOpacity
              style={[styles.actionButton, loading && styles.buttonDisabled]}
              onPress={handleResetPassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Colors.white} size="small" />
              ) : (
                <Text style={styles.actionButtonText}>ALTERAR SENHA</Text>
              )}
            </TouchableOpacity>
          </>
        );

      default:
        return null;
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 1:
        return 'Recuperar Senha';
      case 2:
        return 'Verificar Código';
      case 3:
        return 'Nova Senha';
      default:
        return 'Recuperar Senha';
    }
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
                  <Text style={styles.screenTitle}>{getStepTitle()}</Text>
                  <Text style={styles.screenSubtitle}>Passo {step} de 3</Text>
                </View>
                
                <View style={styles.lightsContainer}>
                  <View style={[styles.light, styles.lightRed]} />
                  <View style={[styles.light, styles.lightYellow]} />
                  <View style={[styles.light, styles.lightBlue]} />
                </View>
              </View>
            </View>

            {/* Progress Indicator */}
            <View style={styles.progressContainer}>
              {[1, 2, 3].map((stepNumber) => (
                <View
                  key={stepNumber}
                  style={[
                    styles.progressStep,
                    stepNumber <= step && styles.progressStepActive,
                    stepNumber < step && styles.progressStepCompleted
                  ]}
                >
                  <Text
                    style={[
                      styles.progressStepText,
                      stepNumber <= step && styles.progressStepTextActive
                    ]}
                  >
                    {stepNumber}
                  </Text>
                </View>
              ))}
            </View>

            {/* Formulário */}
            <View style={styles.formContainer}>
              <View style={styles.formFrame}>
                {renderStepContent()}
              </View>
            </View>

            {/* Link para Login */}
            <View style={styles.loginLinkContainer}>
              <Text style={styles.loginLinkText}>Lembrou da senha? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLink}>Fazer Login</Text>
              </TouchableOpacity>
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
    fontSize: 20,
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

  // Progress Indicator
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    gap: 20,
  },
  progressStep: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gray,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  progressStepActive: {
    backgroundColor: Colors.secondary,
  },
  progressStepCompleted: {
    backgroundColor: Colors.accent,
  },
  progressStepText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.white,
  },
  progressStepTextActive: {
    color: Colors.black,
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
  stepDescription: {
    fontSize: 16,
    color: Colors.gray,
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
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
  actionButton: {
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
  actionButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  resendButton: {
    marginTop: 15,
    alignItems: 'center',
  },
  resendButtonText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },

  // Link para Login
  loginLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginLinkText: {
    color: Colors.white,
    fontSize: 14,
  },
  loginLink: {
    color: Colors.secondary,
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default ForgotPasswordScreen;

