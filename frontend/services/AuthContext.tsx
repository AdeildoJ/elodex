import React, { createContext, useContext, useState, useEffect } from 'react';
import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { LoginManager, AccessToken } from 'react-native-fbsdk-next';
import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  isVip: boolean;
  createdAt: Date;
  lastLogin: Date;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithFacebook: () => Promise<void>;
  logout: () => Promise<void>;
  sendPasswordResetEmail: (email: string) => Promise<void>;
  verifyPasswordResetCode: (code: string) => Promise<void>;
  resetPassword: (code: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Configurar Google Sign-In
    GoogleSignin.configure({
      webClientId: 'YOUR_WEB_CLIENT_ID', // Substituir pela sua web client ID
    });

    // Listener de mudanças de autenticação
    const unsubscribe = auth().onAuthStateChanged(async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Usuário logado, buscar dados do Firestore
          const userDoc = await firestore()
            .collection('users')
            .doc(firebaseUser.uid)
            .get();

          if (userDoc.exists) {
            const userData = userDoc.data();
            const userProfile: User = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || userData?.displayName || '',
              photoURL: firebaseUser.photoURL || userData?.photoURL,
              isVip: userData?.isVip || false,
              createdAt: userData?.createdAt?.toDate() || new Date(),
              lastLogin: new Date(),
            };

            setUser(userProfile);
            
            // Atualizar último login
            await firestore()
              .collection('users')
              .doc(firebaseUser.uid)
              .update({
                lastLogin: firestore.FieldValue.serverTimestamp(),
              });
          } else {
            // Criar perfil do usuário se não existir
            const newUser: Partial<User> = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || '',
              photoURL: firebaseUser.photoURL,
              isVip: false,
              createdAt: new Date(),
              lastLogin: new Date(),
            };

            await firestore()
              .collection('users')
              .doc(firebaseUser.uid)
              .set({
                ...newUser,
                createdAt: firestore.FieldValue.serverTimestamp(),
                lastLogin: firestore.FieldValue.serverTimestamp(),
              });

            setUser(newUser as User);
          }
        } else {
          // Usuário não logado
          setUser(null);
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      await auth().signInWithEmailAndPassword(email, password);
      // O listener onAuthStateChanged cuidará do resto
    } catch (error: any) {
      throw new Error(getAuthErrorMessage(error.code));
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, displayName: string) => {
    try {
      setLoading(true);
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      
      // Atualizar perfil do usuário
      await userCredential.user.updateProfile({
        displayName: displayName,
      });

      // Criar documento do usuário no Firestore
      await firestore()
        .collection('users')
        .doc(userCredential.user.uid)
        .set({
          uid: userCredential.user.uid,
          email: email,
          displayName: displayName,
          isVip: false,
          createdAt: firestore.FieldValue.serverTimestamp(),
          lastLogin: firestore.FieldValue.serverTimestamp(),
        });

      // Fazer logout após registro para forçar login manual
      await auth().signOut();
    } catch (error: any) {
      throw new Error(getAuthErrorMessage(error.code));
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      
      // Verificar se o Google Play Services está disponível
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      
      // Fazer login com Google
      const { idToken } = await GoogleSignin.signIn();
      
      // Criar credencial do Firebase
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);
      
      // Fazer login no Firebase
      await auth().signInWithCredential(googleCredential);
    } catch (error: any) {
      throw new Error('Falha no login com Google');
    } finally {
      setLoading(false);
    }
  };

  const loginWithFacebook = async () => {
    try {
      setLoading(true);
      
      // Fazer login com Facebook
      const result = await LoginManager.logInWithPermissions(['public_profile', 'email']);
      
      if (result.isCancelled) {
        throw new Error('Login cancelado pelo usuário');
      }
      
      // Obter token de acesso
      const data = await AccessToken.getCurrentAccessToken();
      
      if (!data) {
        throw new Error('Falha ao obter token do Facebook');
      }
      
      // Criar credencial do Firebase
      const facebookCredential = auth.FacebookAuthProvider.credential(data.accessToken);
      
      // Fazer login no Firebase
      await auth().signInWithCredential(facebookCredential);
    } catch (error: any) {
      throw new Error('Falha no login com Facebook');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      
      // Logout do Google se estiver logado
      if (await GoogleSignin.isSignedIn()) {
        await GoogleSignin.signOut();
      }
      
      // Logout do Facebook
      LoginManager.logOut();
      
      // Logout do Firebase
      await auth().signOut();
      
      // Limpar dados locais
      await AsyncStorage.clear();
      
      setUser(null);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendPasswordResetEmail = async (email: string) => {
    try {
      await auth().sendPasswordResetEmail(email);
    } catch (error: any) {
      throw new Error(getAuthErrorMessage(error.code));
    }
  };

  const verifyPasswordResetCode = async (code: string) => {
    try {
      await auth().verifyPasswordResetCode(code);
    } catch (error: any) {
      throw new Error('Código inválido ou expirado');
    }
  };

  const resetPassword = async (code: string, newPassword: string) => {
    try {
      await auth().confirmPasswordReset(code, newPassword);
    } catch (error: any) {
      throw new Error('Falha ao alterar senha');
    }
  };

  const getAuthErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'Usuário não encontrado';
      case 'auth/wrong-password':
        return 'Senha incorreta';
      case 'auth/email-already-in-use':
        return 'Este email já está em uso';
      case 'auth/weak-password':
        return 'Senha muito fraca';
      case 'auth/invalid-email':
        return 'Email inválido';
      case 'auth/user-disabled':
        return 'Conta desabilitada';
      case 'auth/too-many-requests':
        return 'Muitas tentativas. Tente novamente mais tarde';
      default:
        return 'Erro de autenticação';
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    register,
    loginWithGoogle,
    loginWithFacebook,
    logout,
    sendPasswordResetEmail,
    verifyPasswordResetCode,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

