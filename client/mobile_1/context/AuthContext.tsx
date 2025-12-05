import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { authAPI } from '@/services/api';

export interface User {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  role: 'proprietaire' | 'locataire' | 'agent' | 'admin' | 'etudiant' | 'enseignant';
  phone?: string;
  bio?: string;
  specialite?: string;
  ville?: string;
  gouvernorat?: string;
  login?: string;
  image?: string | null;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isSignedIn: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (userData: {
    nom: string;
    prenom: string;
    email: string;
    login?: string;
    mdp: string;
    role: 'proprietaire' | 'locataire' | 'agent' | 'admin';
    phone?: string;
    bio?: string;
    ville?: string;
    gouvernorat?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: User }
  | { type: 'CLEAR_USER' }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_SIGNED_IN'; payload: boolean };

const initialState: AuthState = {
  user: null,
  isLoading: false,
  isSignedIn: false,
  error: null,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_USER':
      return { ...state, user: action.payload, isSignedIn: true };
    case 'CLEAR_USER':
      return { ...state, user: null, isSignedIn: false };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'SET_SIGNED_IN':
      return { ...state, isSignedIn: action.payload };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check if user is already logged in
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      let token: string | null = null;
      
      if (Platform.OS !== 'web') {
        token = await SecureStore.getItemAsync('auth_token');
      } else {
        token = localStorage.getItem('auth_token');
      }
      
      if (token) {
        const profileResponse = await authAPI.getProfile();
        if (profileResponse.user) {
          dispatch({ type: 'SET_USER', payload: profileResponse.user });
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      try {
        if (Platform.OS !== 'web') {
          await SecureStore.deleteItemAsync('auth_token');
        } else {
          localStorage.removeItem('auth_token');
        }
      } catch (deleteError) {
        console.error('Error deleting token:', deleteError);
      }
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const login = async (email: string, password: string) => {
    try {
      console.log('\n[AuthContext] ========== LOGIN FLOW START ==========');
      console.log('[AuthContext] 1. Setting loading state to true');
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      console.log('[AuthContext] 2. Calling authAPI.login with email:', email);
      const response = await authAPI.login(email, password);
      console.log('[AuthContext] 3. Got response from API:', JSON.stringify(response, null, 2));
      console.log('[AuthContext] 3.5. Response.user exists?', !!response?.user);
      console.log('[AuthContext] 3.6. Response.user value:', response?.user);
      
      // Use user data from response if available
      if (response && response.user) {
        console.log('[AuthContext] 4a. ✅ Response has user data:', JSON.stringify(response.user, null, 2));
        console.log('[AuthContext] 5. Dispatching SET_USER action...');
        dispatch({ type: 'SET_USER', payload: response.user });
        console.log('[AuthContext] 6. ✅ SET_USER dispatched - isSignedIn should NOW be true');
      } else if (response && response.utilisateur) {
        // Try alternate field name
        console.log('[AuthContext] 4b. ⚠️ Response has utilisateur field instead of user');
        dispatch({ type: 'SET_USER', payload: response.utilisateur });
      } else {
        console.log('[AuthContext] 4c. ❌ Response missing user data, attempting to fetch profile...');
        console.log('[AuthContext] Response keys:', response ? Object.keys(response) : 'null response');
        // If no user in response, try to fetch profile
        try {
          const profileResponse = await authAPI.getProfile();
          console.log('[AuthContext] Profile fetch response:', JSON.stringify(profileResponse, null, 2));
          if (profileResponse && profileResponse.user) {
            console.log('[AuthContext] ✅ Profile fetch successful:', JSON.stringify(profileResponse.user, null, 2));
            dispatch({ type: 'SET_USER', payload: profileResponse.user });
          } else if (profileResponse && profileResponse.utilisateur) {
            console.log('[AuthContext] ⚠️ Profile has utilisateur field');
            dispatch({ type: 'SET_USER', payload: profileResponse.utilisateur });
          } else {
            throw new Error('No user data available');
          }
        } catch (profileError) {
          console.error('[AuthContext] ❌ Profile fetch error:', profileError);
          throw new Error('Could not retrieve user profile after login');
        }
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Login failed';
      console.error('[AuthContext] ❌ ERROR:', errorMessage);
      console.error('[AuthContext] Full error:', error);
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    } finally {
      console.log('[AuthContext] 7. Setting loading state to false');
      dispatch({ type: 'SET_LOADING', payload: false });
      console.log('[AuthContext] ========== LOGIN FLOW END ==========\n');
    }
  };

  const register = async (userData: {
    nom: string;
    prenom: string;
    email: string;
    login?: string;
    mdp: string;
    role: 'proprietaire' | 'locataire' | 'agent' | 'admin';
    phone?: string;
    bio?: string;
    ville?: string;
    gouvernorat?: string;
  }) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      console.log('📝 Attempting registration with:', userData);
      const response = await authAPI.register(userData);
      console.log('✅ Registration successful, response:', response);
      
      // Use user data from response if available
      if (response.user) {
        console.log('✅ User data from registration response:', response.user);
        dispatch({ type: 'SET_USER', payload: response.user });
      } else {
        // Fallback: try to get profile
        try {
          const profileResponse = await authAPI.getProfile();
          if (profileResponse.user) {
            console.log('✅ User data from profile:', profileResponse.user);
            dispatch({ type: 'SET_USER', payload: profileResponse.user });
          }
        } catch (profileError) {
          console.error('⚠️ Could not fetch profile, using basic user data:', profileError);
          // Still set user with minimal data if profile fetch fails
          if (response.user) {
            dispatch({ type: 'SET_USER', payload: response.user });
          }
        }
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Registration failed';
      console.error('❌ Registration error:', errorMessage);
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch({ type: 'CLEAR_USER' });
      try {
        if (Platform.OS !== 'web') {
          await SecureStore.deleteItemAsync('auth_token');
        } else {
          localStorage.removeItem('auth_token');
        }
      } catch (deleteError) {
        console.error('Error deleting token:', deleteError);
      }
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    checkAuth,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
