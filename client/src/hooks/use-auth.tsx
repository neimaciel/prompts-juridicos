import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface User {
  id: number;
  email: string;
  tokenBalance: number;
  subscriptionPlan: string;
  subscriptionStatus: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthResponse {
  user: User;
  token: string;
}

export function useAuth() {
  const [token, setToken] = useState<string | null>(() => 
    localStorage.getItem('auth_token')
  );
  
  const queryClient = useQueryClient();

  // Check session status (for Google OAuth)
  const { data: sessionData } = useQuery({
    queryKey: ['/api/auth/session'],
    retry: false,
    queryFn: async () => {
      const response = await fetch('/api/auth/session', {
        credentials: 'include' // Include cookies for session
      });
      
      if (!response.ok) {
        return { isAuthenticated: false, user: null };
      }
      
      return response.json();
    }
  });

  // Get current user data (for token auth)
  const { data: userData, isLoading, error } = useQuery({
    queryKey: ['/api/auth/me'],
    enabled: !!token,
    retry: false,
    queryFn: async (): Promise<User> => {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    }
  });

  // Determine current user (prioritize session over token)
  const currentUser = sessionData?.user || userData;
  const isAuthenticated = sessionData?.isAuthenticated || !!userData;

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const response = await apiRequest('POST', '/api/auth/login', { email, password });
      return response;
    },
    onSuccess: (data) => {
      setToken(data.token);
      localStorage.setItem('auth_token', data.token);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    }
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async ({ 
      email, 
      password, 
      firstName, 
      lastName 
    }: { 
      email: string; 
      password: string; 
      firstName?: string; 
      lastName?: string; 
    }) => {
      const response = await apiRequest('POST', '/api/auth/register', { email, password, firstName, lastName });
      return response;
    },
    onSuccess: (data) => {
      setToken(data.token);
      localStorage.setItem('auth_token', data.token);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    }
  });

  // Logout function (works for both token and session)
  const logout = async () => {
    // Clear token auth
    setToken(null);
    localStorage.removeItem('auth_token');
    
    // Clear session auth (Google OAuth)
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Error logging out:', error);
    }
    
    queryClient.clear();
    window.location.reload(); // Refresh to clear all state
  };

  // Setup auth interceptor for token
  useEffect(() => {
    if (token && typeof token === 'string') {
      // Set default authorization header for all requests
      const originalFetch = window.fetch;
      window.fetch = (url, options = {}) => {
        // Ensure options and headers exist
        const safeOptions = options || {};
        const safeHeaders = safeOptions.headers || {};
        
        return originalFetch(url, {
          ...safeOptions,
          headers: {
            ...safeHeaders,
            Authorization: `Bearer ${token}`
          }
        });
      };
    }
  }, [token]);

  return {
    user: currentUser,
    isAuthenticated,
    isLoading,
    error,
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout,
    loginError: loginMutation.error,
    registerError: registerMutation.error,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending
  };
}