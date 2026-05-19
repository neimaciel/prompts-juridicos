import { useState, useEffect } from 'react';
import { api } from '../lib/api';

interface User {
  id: number;
  email: string;
  tokenBalance: number;
  subscriptionPlan: string;
  subscriptionStatus: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await api.getProfile();
      if (response.data) {
        setUser(response.data as User);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await api.login(email, password);
    if (response.data) {
      setUser(response.data as User);
      return { success: true };
    }
    return { success: false, error: response.error };
  };

  const register = async (email: string, password: string) => {
    const response = await api.register(email, password);
    if (response.data) {
      setUser(response.data as User);
      return { success: true };
    }
    return { success: false, error: response.error };
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  const updateTokenBalance = (newBalance: number) => {
    if (user) {
      setUser({ ...user, tokenBalance: newBalance });
    }
  };

  return {
    user,
    loading,
    login,
    register,
    logout,
    updateTokenBalance,
    refreshAuth: checkAuth
  };
};