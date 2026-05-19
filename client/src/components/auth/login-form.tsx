import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/use-auth';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { FaGoogle } from 'react-icons/fa';

interface LoginFormProps {
  onToggleMode: () => void;
  onSuccess?: () => void;
}

export function LoginForm({ onToggleMode, onSuccess }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const { login, loginError, isLoggingIn } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(
      { email, password },
      {
        onSuccess: () => {
          onSuccess?.();
        }
      }
    );
  };

  const handleGoogleLogin = () => {
    // Redirect to Google OAuth endpoint
    window.location.href = '/api/auth/google';
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-slate-800">
          Entrar
        </CardTitle>
        <CardDescription>
          Entre na sua conta para exportar documentos
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Google OAuth temporariamente oculto */}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </Button>
            </div>
          </div>

          {loginError && (
            <Alert variant="destructive">
              <AlertDescription>
                {loginError.message || 'Erro ao fazer login. Verifique suas credenciais.'}
              </AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700"
            disabled={isLoggingIn}
          >
            {isLoggingIn ? 'Entrando...' : 'Entrar'}
          </Button>

          <div className="text-center">
            <Button
              type="button"
              variant="link"
              onClick={onToggleMode}
              className="text-indigo-600 hover:text-indigo-700"
            >
              Não tem conta? Registre-se
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}