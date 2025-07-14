import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  email: string;
  name: string;
  isVip: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<boolean>;
  resetPassword: (code: string, newPassword: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const userData = await AsyncStorage.getItem('@EloDex:user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Erro ao verificar estado de autenticação:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Simulação de login - substituir por integração real com Firebase
      if (email && password) {
        const userData: User = {
          id: '1',
          email: email,
          name: 'Usuário Teste',
          isVip: false,
        };
        
        await AsyncStorage.setItem('@EloDex:user', JSON.stringify(userData));
        setUser(userData);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erro no login:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Simulação de registro - substituir por integração real com Firebase
      if (name && email && password) {
        // Simula sucesso no registro
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erro no registro:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem('@EloDex:user');
      setUser(null);
    } catch (error) {
      console.error('Erro no logout:', error);
    }
  };

  const forgotPassword = async (email: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Simulação de envio de código - substituir por integração real com Firebase
      if (email) {
        // Simula envio de email com código
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erro ao enviar código:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (code: string, newPassword: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Simulação de reset de senha - substituir por integração real com Firebase
      if (code && newPassword) {
        // Simula sucesso no reset
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erro ao resetar senha:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

