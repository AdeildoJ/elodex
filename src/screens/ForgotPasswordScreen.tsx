import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../utils/Colors';

interface ForgotPasswordScreenProps {
  navigation: any;
}

const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ navigation }) => {
  const [step, setStep] = useState<'email' | 'code' | 'newPassword'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { forgotPassword, resetPassword } = useAuth();

  const handleSendCode = async () => {
    if (!email.trim()) {
      Alert.alert('Erro', 'Por favor, digite seu email');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Erro', 'Por favor, digite um email válido');
      return;
    }

    setIsLoading(true);
    try {
      const success = await forgotPassword(email.trim());
      if (success) {
        Alert.alert(
          'Código Enviado!', 
          'Verifique seu email e digite o código de recuperação.',
          [{ text: 'OK', onPress: () => setStep('code') }]
        );
      } else {
        Alert.alert('Erro', 'Email não encontrado. Verifique e tente novamente.');
      }
    } catch (error) {
      Alert.alert('Erro', 'Erro ao enviar código. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = () => {
    if (!code.trim()) {
      Alert.alert('Erro', 'Por favor, digite o código recebido');
      return;
    }

    if (code.trim().length !== 6) {
      Alert.alert('Erro', 'O código deve ter 6 dígitos');
      return;
    }

    setStep('newPassword');
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

    if (newPassword !== confirmPassword) {
      Alert.alert('Erro', 'As senhas não coincidem');
      return;
    }

    setIsLoading(true);
    try {
      const success = await resetPassword(code, newPassword);
      if (success) {
        Alert.alert(
          'Sucesso!', 
          'Senha alterada com sucesso! Faça login com sua nova senha.',
          [
            { 
              text: 'OK', 
              onPress: () => navigation.navigate('Login')
            }
          ]
        );
      } else {
        Alert.alert('Erro', 'Código inválido ou expirado. Tente novamente.');
      }
    } catch (error) {
      Alert.alert('Erro', 'Erro ao alterar senha. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderEmailStep = () => (
    <View style={styles.formContainer}>
      <Text style={styles.description}>
        Digite seu email para receber um código de recuperação de senha.
      </Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="Digite seu email"
          placeholderTextColor={Colors.grayMedium}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!isLoading}
        />
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
        onPress={handleSendCode}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <Text style={styles.primaryButtonText}>Enviar Código</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderCodeStep = () => (
    <View style={styles.formContainer}>
      <Text style={styles.description}>
        Digite o código de 6 dígitos que foi enviado para seu email.
      </Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Código de Recuperação</Text>
        <TextInput
          style={styles.input}
          placeholder="Digite o código (6 dígitos)"
          placeholderTextColor={Colors.grayMedium}
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
          maxLength={6}
          editable={!isLoading}
        />
      </View>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleVerifyCode}
      >
        <Text style={styles.primaryButtonText}>Verificar Código</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => setStep('email')}
      >
        <Text style={styles.secondaryButtonText}>Voltar</Text>
      </TouchableOpacity>
    </View>
  );

  const renderNewPasswordStep = () => (
    <View style={styles.formContainer}>
      <Text style={styles.description}>
        Digite sua nova senha. Ela deve ter pelo menos 6 caracteres.
      </Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Nova Senha</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Digite sua nova senha"
            placeholderTextColor={Colors.grayMedium}
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry={!showPassword}
            editable={!isLoading}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Confirmar Nova Senha</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Confirme sua nova senha"
            placeholderTextColor={Colors.grayMedium}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
            editable={!isLoading}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            <Text style={styles.eyeText}>{showConfirmPassword ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
        onPress={handleResetPassword}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <Text style={styles.primaryButtonText}>Alterar Senha</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => setStep('code')}
      >
        <Text style={styles.secondaryButtonText}>Voltar</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Voltar</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Recuperar Senha</Text>
          <Text style={styles.subtitle}>
            {step === 'email' && 'Digite seu email'}
            {step === 'code' && 'Verifique seu email'}
            {step === 'newPassword' && 'Nova senha'}
          </Text>
        </View>

        {/* Indicador de Progresso */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressStep, step === 'email' && styles.progressStepActive]}>
            <Text style={[styles.progressText, step === 'email' && styles.progressTextActive]}>1</Text>
          </View>
          <View style={[styles.progressLine, (step === 'code' || step === 'newPassword') && styles.progressLineActive]} />
          <View style={[styles.progressStep, step === 'code' && styles.progressStepActive]}>
            <Text style={[styles.progressText, step === 'code' && styles.progressTextActive]}>2</Text>
          </View>
          <View style={[styles.progressLine, step === 'newPassword' && styles.progressLineActive]} />
          <View style={[styles.progressStep, step === 'newPassword' && styles.progressStepActive]}>
            <Text style={[styles.progressText, step === 'newPassword' && styles.progressTextActive]}>3</Text>
          </View>
        </View>

        {/* Conteúdo baseado no step */}
        {step === 'email' && renderEmailStep()}
        {step === 'code' && renderCodeStep()}
        {step === 'newPassword' && renderNewPasswordStep()}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.grayLight,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 20,
    padding: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: Colors.accent,
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.gray,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  progressStep: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.grayMedium,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressStepActive: {
    backgroundColor: Colors.primary,
  },
  progressText: {
    color: Colors.white,
    fontWeight: 'bold',
  },
  progressTextActive: {
    color: Colors.white,
  },
  progressLine: {
    width: 50,
    height: 2,
    backgroundColor: Colors.grayMedium,
  },
  progressLineActive: {
    backgroundColor: Colors.primary,
  },
  formContainer: {
    backgroundColor: Colors.white,
    borderRadius: 15,
    padding: 25,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  description: {
    fontSize: 16,
    color: Colors.gray,
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.grayLight,
    borderWidth: 2,
    borderColor: Colors.grayMedium,
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: Colors.black,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.grayLight,
    borderWidth: 2,
    borderColor: Colors.grayMedium,
    borderRadius: 12,
  },
  passwordInput: {
    flex: 1,
    padding: 15,
    fontSize: 16,
    color: Colors.black,
  },
  eyeButton: {
    padding: 15,
  },
  eyeText: {
    fontSize: 18,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonDisabled: {
    backgroundColor: Colors.grayMedium,
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.grayMedium,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 15,
  },
  secondaryButtonText: {
    color: Colors.gray,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ForgotPasswordScreen;

