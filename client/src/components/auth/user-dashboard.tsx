import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { 
  User, 
  LogOut, 
  Coins, 
  FileText, 
  Download,
  Calendar,
  CreditCard,
  History
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface UserDashboardProps {
  onClose: () => void;
}

interface TokenTransaction {
  id: number;
  type: string;
  amount: number;
  operation?: string;
  description?: string;
  balanceAfter: number;
  createdAt: string;
}

interface GeneratedDocument {
  id: number;
  promptId: number;
  format: string;
  tokensConsumed: number;
  generatedAt: string;
  downloadCount: number;
}

export function UserDashboard({ onClose }: UserDashboardProps) {
  const { user, tokens, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: tokenHistory } = useQuery({
    queryKey: ['/api/user/token-history'],
    enabled: !!user
  });

  const { data: documents } = useQuery({
    queryKey: ['/api/user/documents'],
    enabled: !!user
  });

  const handleLogout = () => {
    logout();
    onClose();
  };

  const getInitials = () => {
    if (!user) return 'U';
    return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || user.email[0].toUpperCase();
  };

  const getPlanBadgeVariant = (plan: string) => {
    switch (plan) {
      case 'free': return 'secondary';
      case 'professional': return 'default';
      case 'enterprise': return 'destructive';
      default: return 'secondary';
    }
  };

  const getPlanName = (plan: string) => {
    switch (plan) {
      case 'free': return 'Gratuito';
      case 'professional': return 'Profissional';
      case 'enterprise': return 'Empresarial';
      default: return plan;
    }
  };

  if (!user || !tokens) {
    return null;
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      {/* User Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-indigo-100 text-indigo-600 text-lg font-semibold">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              {user.firstName || user.lastName 
                ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                : user.email
              }
            </h1>
            <div className="flex items-center gap-2">
              <Badge variant={getPlanBadgeVariant(user.currentPlan)}>
                {getPlanName(user.currentPlan)}
              </Badge>
              <span className="text-sm text-gray-500">•</span>
              <span className="text-sm text-gray-500">{user.email}</span>
            </div>
          </div>
        </div>
        <Button 
          variant="outline" 
          onClick={handleLogout}
          className="flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="documents">Documentos</TabsTrigger>
          <TabsTrigger value="tokens">Tokens</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Token Balance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tokens Disponíveis</CardTitle>
                <Coins className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-indigo-600">
                  {tokens.currentBalance}
                </div>
                <p className="text-xs text-muted-foreground">
                  Plano: {tokens.planTokens} tokens
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Consumido</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {tokens.totalConsumed}
                </div>
                <p className="text-xs text-muted-foreground">
                  Tokens utilizados
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Documentos Gerados</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {documents?.length || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total de documentos
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Atividade Recente</CardTitle>
              <CardDescription>
                Últimas transações de tokens e documentos gerados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tokenHistory && tokenHistory.length > 0 ? (
                <div className="space-y-3">
                  {tokenHistory.slice(0, 5).map((transaction: TokenTransaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                      <div className="flex items-center gap-3">
                        <History className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="font-medium">
                            {transaction.type === 'consume' ? 'Documento Exportado' : 'Tokens Adicionados'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {transaction.description}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-medium ${
                          transaction.type === 'consume' ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {transaction.type === 'consume' ? '-' : '+'}{transaction.amount} tokens
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(transaction.createdAt), { 
                            addSuffix: true, 
                            locale: ptBR 
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">
                  Nenhuma atividade recente
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Seus Documentos</CardTitle>
              <CardDescription>
                Documentos que você gerou e exportou
              </CardDescription>
            </CardHeader>
            <CardContent>
              {documents && documents.length > 0 ? (
                <div className="space-y-3">
                  {documents.map((doc: GeneratedDocument) => (
                    <div key={doc.id} className="flex items-center justify-between p-4 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-indigo-600" />
                        <div>
                          <p className="font-medium">Documento {doc.format.toUpperCase()}</p>
                          <p className="text-sm text-gray-500">
                            Gerado {formatDistanceToNow(new Date(doc.generatedAt), { 
                              addSuffix: true, 
                              locale: ptBR 
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium">{doc.tokensConsumed} tokens</p>
                          <p className="text-xs text-gray-500">{doc.downloadCount} downloads</p>
                        </div>
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">
                  Você ainda não gerou nenhum documento
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tokens" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Tokens</CardTitle>
              <CardDescription>
                Todas as transações de tokens da sua conta
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tokenHistory && tokenHistory.length > 0 ? (
                <div className="space-y-3">
                  {tokenHistory.map((transaction: TokenTransaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                          transaction.type === 'consume' ? 'bg-red-100' : 'bg-green-100'
                        }`}>
                          {transaction.type === 'consume' ? (
                            <CreditCard className={`h-4 w-4 text-red-600`} />
                          ) : (
                            <Coins className={`h-4 w-4 text-green-600`} />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">
                            {transaction.operation || (transaction.type === 'consume' ? 'Exportação de Documento' : 'Adição de Tokens')}
                          </p>
                          <p className="text-sm text-gray-500">
                            {transaction.description}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-medium ${
                          transaction.type === 'consume' ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {transaction.type === 'consume' ? '-' : '+'}{transaction.amount} tokens
                        </p>
                        <p className="text-xs text-gray-500">
                          Saldo: {transaction.balanceAfter} tokens
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(transaction.createdAt), { 
                            addSuffix: true, 
                            locale: ptBR 
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">
                  Nenhuma transação encontrada
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}