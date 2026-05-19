import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/use-auth';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import { FaGoogle } from 'react-icons/fa';
import { Separator } from '@/components/ui/separator';

interface RegisterFormProps {
  onToggleMode: () => void;
  onSuccess?: () => void;
}

export function RegisterForm({ onToggleMode, onSuccess }: RegisterFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const { register, registerError, isRegistering } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    register(
      { email, password, firstName, lastName },
      {
        onSuccess: () => {
          onSuccess?.();
        }
      }
    );
  };

  const handleGoogleRegister = () => {
    // Redirect to Google OAuth endpoint
    window.location.href = '/api/auth/google';
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-slate-800">
          Criar Conta
        </CardTitle>
        <CardDescription>
          Registre-se para receber 1700 tokens gratuitos
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Google OAuth temporariamente oculto */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Nome</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="firstName"
                  placeholder="João"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lastName">Sobrenome</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="lastName"
                  placeholder="Silva"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

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
                minLength={6}
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
            <p className="text-sm text-gray-500">
              Mínimo 6 caracteres
            </p>
          </div>

          {registerError && (
            <Alert variant="destructive">
              <AlertDescription>
                {registerError.message || 'Erro ao criar conta. Tente novamente.'}
              </AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700"
            disabled={isRegistering}
          >
            {isRegistering ? 'Criando Conta...' : 'Criar Conta'}
          </Button>

          <div className="text-center">
            <Button
              type="button"
              variant="link"
              onClick={onToggleMode}
              className="text-indigo-600 hover:text-indigo-700"
            >
              Já tem conta? Entre aqui
            </Button>
          </div>

          <div className="text-center pt-4">
            <p className="text-sm text-gray-600">
              ✅ 10 tokens gratuitos ao se registrar<br />
              💾 Exportação de documentos em PDF, DOC e TXT<br />
              📄 Histórico de documentos gerados
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}