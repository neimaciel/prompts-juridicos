import { useState, useEffect } from 'react';
import { LoginForm } from './login-form';
import { RegisterForm } from './register-form';
import { X } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);

  // console.log('AuthModal render:', { isOpen, mode });

  const handleToggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
  };

  const handleSuccess = () => {
    onClose();
  };

  // Block scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl max-w-md w-full max-h-[90vh] overflow-auto relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
        
        <div className="p-6">
          {mode === 'login' ? (
            <LoginForm 
              onToggleMode={handleToggleMode}
              onSuccess={handleSuccess}
            />
          ) : (
            <RegisterForm 
              onToggleMode={handleToggleMode}
              onSuccess={handleSuccess}
            />
          )}
        </div>
      </div>
    </div>
  );
}