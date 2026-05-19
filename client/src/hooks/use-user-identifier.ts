import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

// Simple browser fingerprint generation
function generateBrowserFingerprint(): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Browser fingerprint', 2, 2);
  }
  
  const fingerprint = {
    userAgent: navigator.userAgent,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    screen: `${screen.width}x${screen.height}`,
    canvas: canvas.toDataURL(),
    platform: navigator.platform,
    cookieEnabled: navigator.cookieEnabled,
    doNotTrack: navigator.doNotTrack
  };
  
  // Create a simple hash from fingerprint data
  const fingerprintString = JSON.stringify(fingerprint);
  let hash = 0;
  for (let i = 0; i < fingerprintString.length; i++) {
    const char = fingerprintString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(36);
}

// Check if user is authenticated (has valid token)
async function checkAuthStatus(): Promise<{ isAuthenticated: boolean; userId?: string }> {
  try {
    const token = localStorage.getItem('auth-token');
    if (!token) {
      return { isAuthenticated: false };
    }

    const response = await fetch('/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      const userData = await response.json();
      return { isAuthenticated: true, userId: userData.id.toString() };
    } else {
      // Token is invalid, remove it
      localStorage.removeItem('auth-token');
      return { isAuthenticated: false };
    }
  } catch (error) {
    console.error('Error checking auth status:', error);
    return { isAuthenticated: false };
  }
}

export function useUserIdentifier() {
  const [userIdentifier, setUserIdentifier] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication status
  const { data: authData, isLoading: isCheckingAuth } = useQuery({
    queryKey: ['auth-status'],
    queryFn: checkAuthStatus,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false
  });

  useEffect(() => {
    if (authData) {
      setIsAuthenticated(authData.isAuthenticated);
      
      if (authData.isAuthenticated && authData.userId) {
        // Authenticated user: use user ID
        setUserIdentifier(`user:${authData.userId}`);
      } else {
        // Non-authenticated user: use browser fingerprint
        let guestId = localStorage.getItem('guest-id');
        
        if (!guestId) {
          guestId = generateBrowserFingerprint();
          localStorage.setItem('guest-id', guestId);
        }
        
        setUserIdentifier(`guest:${guestId}`);
      }
    }
  }, [authData]);

  return {
    userIdentifier,
    isAuthenticated,
    isLoading: isCheckingAuth || !userIdentifier
  };
}