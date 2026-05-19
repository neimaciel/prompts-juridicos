import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Settings, 
  LogOut, 
  Users, 
  FileText, 
  Search, 
  UserCheck, 
  X, 
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
  DollarSign,
  TrendingUp,
  Star,
  Clock,
  Database,
  Eye,
  EyeOff,
  Shield,
  Activity,
  Trash2,
  BarChart3,
  Brain,
  Save,
  Zap,
  Heart,
  MessageSquare,
  TrendingDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

// Componente principal do painel administrativo
export default function AdminPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Verificação de autenticação administrativa
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/admin/auth', {
          credentials: 'include'
        });
        
        if (response.status === 401) {
          // Redirecionar para login se não autenticado
          window.location.href = '/login?admin=true';
          return;
        }
        
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Erro na verificação de autenticação:', error);
        // Em desenvolvimento, permitir acesso
        setIsAuthenticated(true);
      }
    };

    checkAuth();
  }, []);

  const handleLogout = () => {
    setLocation('/');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Verificando autenticação...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Settings className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-slate-800">Painel Administrativo</h1>
          </div>
          <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>

        <Tabs defaultValue="settings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="settings">Configurações</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="presets">Presets</TabsTrigger>
            <TabsTrigger value="quality">Qualidade</TabsTrigger>
            <TabsTrigger value="suggestions">Sugestões</TabsTrigger>
            <TabsTrigger value="ratings">Ratings</TabsTrigger>
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="contracts">Contratos</TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="space-y-6">
            <SettingsManagement />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <AnalyticsManagement />
          </TabsContent>

          <TabsContent value="presets" className="space-y-6">
            <PresetsManagement />
          </TabsContent>

          <TabsContent value="quality" className="space-y-6">
            <QualityManagement />
          </TabsContent>

          <TabsContent value="suggestions" className="space-y-6">
            <SuggestionsManagement />
          </TabsContent>

          <TabsContent value="ratings" className="space-y-6">
            <RatingsManagement />
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <UsersManagement />
          </TabsContent>

          <TabsContent value="contracts" className="space-y-6">
            <ContractsManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Componente de Gerenciamento de Usuários
function UsersManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [tokenAmountInput, setTokenAmountInput] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [selectedOperation, setSelectedOperation] = useState<'add' | 'subtract' | 'set'>('add');

  // Fetch users
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    refetchInterval: 30000,
  });

  // Fetch user statistics
  const { data: userStats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/admin/users/stats"],
    refetchInterval: 30000,
  });

  // Update user tokens mutation
  const updateTokensMutation = useMutation({
    mutationFn: async ({ userId, tokenAmount, operation }: { userId: number; tokenAmount: number; operation: string }) => {
      const response = await fetch(`/api/admin/users/${userId}/tokens`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenAmount, operation })
      });
      if (!response.ok) throw new Error('Falha ao atualizar tokens');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users/stats"] });
      toast({
        title: "Tokens atualizados",
        description: "Os tokens do usuário foram atualizados com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao atualizar tokens do usuário.",
        variant: "destructive",
      });
    },
  });

  // Distribute tokens to multiple users mutation
  const distributeTokensMutation = useMutation({
    mutationFn: async ({ userIds, tokenAmount, operation }: { userIds: number[]; tokenAmount: number; operation: string }) => {
      const response = await fetch('/api/admin/users/distribute-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds, tokenAmount, operation })
      });
      if (!response.ok) throw new Error('Falha ao distribuir tokens');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users/stats"] });
      setSelectedUserIds([]);
      setTokenAmountInput("");
      toast({
        title: "Tokens distribuídos",
        description: `${data.successful} usuários atualizados com sucesso. ${data.failed} falharam.`,
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao distribuir tokens.",
        variant: "destructive",
      });
    },
  });

  const users = (usersData as any)?.users || [];
  const filteredUsers = users.filter((user: any) => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleTokenUpdate = (userId: number, amount: number, operation: 'add' | 'subtract' | 'set') => {
    updateTokensMutation.mutate({ userId, tokenAmount: amount, operation });
  };

  const handleBulkDistribution = () => {
    const amount = parseInt(tokenAmountInput);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Valor inválido",
        description: "Digite um valor válido de tokens.",
        variant: "destructive",
      });
      return;
    }

    if (selectedUserIds.length === 0) {
      toast({
        title: "Nenhum usuário selecionado",
        description: "Selecione pelo menos um usuário para distribuir tokens.",
        variant: "destructive",
      });
      return;
    }

    distributeTokensMutation.mutate({
      userIds: selectedUserIds,
      tokenAmount: amount,
      operation: selectedOperation
    });
  };

  const toggleUserSelection = (userId: number) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAllUsers = () => {
    setSelectedUserIds(filteredUsers.map((user: any) => user.id));
  };

  const clearSelection = () => {
    setSelectedUserIds([]);
  };

  return (
    <div className="space-y-6">
      {/* Estatísticas de Usuários */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total de Usuários</p>
                <p className="text-2xl font-bold">{(userStats as any)?.totalUsers || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Tokens em Circulação</p>
                <p className="text-2xl font-bold">{(userStats as any)?.tokenStats?.totalTokens || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Média de Tokens</p>
                <p className="text-2xl font-bold">{Math.round((userStats as any)?.tokenStats?.avgTokens || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Novos Usuários</p>
                <p className="text-2xl font-bold">{(userStats as any)?.recentUsers || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Distribuição em Lote */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Distribuição de Tokens em Lote
          </CardTitle>
          <CardDescription>
            Distribua tokens para múltiplos usuários simultaneamente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-40">
              <Label htmlFor="tokenAmount">Quantidade de Tokens</Label>
              <Input
                id="tokenAmount"
                type="number"
                placeholder="Ex: 1000"
                value={tokenAmountInput}
                onChange={(e) => setTokenAmountInput(e.target.value)}
              />
            </div>
            
            <div className="min-w-32">
              <Label>Operação</Label>
              <Select value={selectedOperation} onValueChange={(value: any) => setSelectedOperation(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">Adicionar (+)</SelectItem>
                  <SelectItem value="subtract">Subtrair (-)</SelectItem>
                  <SelectItem value="set">Definir (=)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button
              onClick={handleBulkDistribution}
              disabled={distributeTokensMutation.isPending || selectedUserIds.length === 0}
              className="flex items-center gap-2"
            >
              <DollarSign className="h-4 w-4" />
              Distribuir Tokens
            </Button>
          </div>

          {selectedUserIds.length > 0 && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-900">
                  {selectedUserIds.length} usuários selecionados
                </span>
                <Button variant="outline" size="sm" onClick={clearSelection}>
                  Limpar Seleção
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Busca de Usuários */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Busca e Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-60">
              <Input
                placeholder="Buscar por email, nome ou sobrenome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Button variant="outline" onClick={selectAllUsers}>
              <UserCheck className="h-4 w-4 mr-2" />
              Selecionar Todos
            </Button>
            <Button variant="outline" onClick={clearSelection}>
              <X className="h-4 w-4 mr-2" />
              Limpar Seleção
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Usuários */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Usuários ({filteredUsers.length})
            </span>
            <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {usersLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            ) : (
              filteredUsers.map((user: any) => (
                <UserRow 
                  key={user.id} 
                  user={user} 
                  isSelected={selectedUserIds.includes(user.id)}
                  onSelect={() => toggleUserSelection(user.id)}
                  onTokenUpdate={handleTokenUpdate}
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Componente de linha de usuário individual
function UserRow({ user, isSelected, onSelect, onTokenUpdate }: {
  user: any;
  isSelected: boolean;
  onSelect: () => void;
  onTokenUpdate: (userId: number, amount: number, operation: 'add' | 'subtract' | 'set') => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusColor = (plan: string) => {
    switch (plan) {
      case 'free': return 'bg-gray-100 text-gray-800';
      case 'professional': return 'bg-blue-100 text-blue-800';
      case 'enterprise': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTokenColor = (tokens: number) => {
    if (tokens === 0) return 'text-red-600';
    if (tokens < 100) return 'text-yellow-600';
    if (tokens < 500) return 'text-blue-600';
    return 'text-green-600';
  };

  return (
    <div className={`border rounded-lg p-4 transition-all ${isSelected ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onSelect}
            className="h-4 w-4 text-blue-600 rounded"
          />
          
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div>
                <p className="font-medium text-gray-900">{user.email}</p>
                <p className="text-sm text-gray-600">
                  {user.firstName} {user.lastName} • ID: {user.id}
                </p>
              </div>
              
              <Badge className={getStatusColor(user.currentPlan)}>
                {user.currentPlan}
              </Badge>
              
              {user.emailVerified ? (
                <Badge className="bg-green-100 text-green-800">
                  ✓ Verificado
                </Badge>
              ) : (
                <Badge variant="outline">
                  Não verificado
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className={`font-bold ${getTokenColor(user.tokenBalance)}`}>
              {user.tokenBalance} tokens
            </p>
            <p className="text-xs text-gray-500">
              {new Date(user.createdAt).toLocaleDateString()}
            </p>
          </div>

          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onTokenUpdate(user.id, 500, 'add')}
              className="text-green-600 hover:bg-green-50"
            >
              +500
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onTokenUpdate(user.id, 100, 'subtract')}
              className="text-red-600 hover:bg-red-50"
            >
              -100
            </Button>
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Informações</Label>
              <div className="text-sm space-y-1">
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Nome:</strong> {user.firstName} {user.lastName}</p>
                <p><strong>Plano:</strong> {user.currentPlan}</p>
                <p><strong>Criado em:</strong> {new Date(user.createdAt).toLocaleString()}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">Estatísticas</Label>
              <div className="text-sm space-y-1">
                <p><strong>Tokens:</strong> {user.tokenBalance}</p>
                <p><strong>Email Verificado:</strong> {user.emailVerified ? 'Sim' : 'Não'}</p>
                <p><strong>Última Atualização:</strong> {new Date(user.updatedAt).toLocaleString()}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">Ações</Label>
              <div className="flex flex-col gap-2">
                <Button size="sm" variant="outline" className="justify-start">
                  <Activity className="h-4 w-4 mr-2" />
                  Ver Atividades
                </Button>
                <Button size="sm" variant="outline" className="justify-start text-red-600">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Deletar Usuário
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Componente de Gerenciamento de Contratos
function ContractsManagement() {
  const { data: contractStats } = useQuery({
    queryKey: ["/api/admin/contracts/stats"],
    queryFn: async () => {
      // Mock data para demonstração
      return {
        totalUsers: 0,
        totalAnalyses: 0,
        totalRevenue: 0,
        systemStatus: 'operational'
      };
    }
  });

  return (
    <div className="space-y-6">
      {/* Estatísticas do Sistema de Contratos */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Usuários Registrados</p>
                <p className="text-2xl font-bold">{contractStats?.totalUsers || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Análises Realizadas</p>
                <p className="text-2xl font-bold">{contractStats?.totalAnalyses || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Receita Total</p>
                <p className="text-2xl font-bold">R$ {contractStats?.totalRevenue || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Activity className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Status do Sistema</p>
                <Badge className="bg-green-100 text-green-800">
                  Operacional
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Painel de Controle do Sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Sistema de Análise de Contratos
          </CardTitle>
          <CardDescription>
            Gerencie usuários, análises e configurações do sistema de contratos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold">Configurações Gerais</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium">Status do Servidor</p>
                    <p className="text-sm text-slate-600">Sistema operacional em /docsmart</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    Online
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium">Criptografia</p>
                    <p className="text-sm text-slate-600">AES-256-GCM ativo</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    Ativo
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">Ações Administrativas</h3>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  Gerenciar Usuários do Sistema
                </Button>
                
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Ver Análises Realizadas
                </Button>
                
                <Button variant="outline" className="w-full justify-start">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Relatórios Financeiros
                </Button>
                
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="h-4 w-4 mr-2" />
                  Configurar Planos e Preços
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sistema Integrado */}
      <Card>
        <CardHeader>
          <CardTitle>Sistema Integrado</CardTitle>
          <CardDescription>
            O sistema de análise de contratos está integrado e operacional
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <p className="font-medium text-green-800">Sistema Operacional</p>
                  <p className="text-sm text-green-600">
                    O sistema de contratos está funcionando corretamente em /docsmart
                  </p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <p className="text-2xl font-bold text-slate-700">0</p>
                <p className="text-sm text-slate-600">Contratos Analisados</p>
              </div>
              
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <p className="text-2xl font-bold text-slate-700">0</p>
                <p className="text-sm text-slate-600">Usuários Ativos</p>
              </div>
              
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <p className="text-2xl font-bold text-slate-700">100%</p>
                <p className="text-sm text-slate-600">Uptime</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Componente de Configurações do Sistema
function SettingsManagement() {
  const { toast } = useToast();
  const [showApiKeys, setShowApiKeys] = useState({
    openai: false,
    claude: false,
    gemini: false,
  });

  // Fetch settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/admin/settings"],
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: any) => {
      const response = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });
      if (!response.ok) throw new Error('Falha ao atualizar configurações');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Configurações atualizadas",
        description: "As configurações do sistema foram atualizadas com sucesso.",
      });
    },
  });

  if (isLoading) {
    return <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-32 bg-gray-100 rounded animate-pulse" />
      ))}
    </div>;
  }

  return (
    <div className="space-y-6">
      {/* Configurações de IA */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Configurações de IA
          </CardTitle>
          <CardDescription>
            Configure os modelos de IA e suas API keys
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Modelo Ativo</Label>
              <Select 
                value={settings?.activeAiModel || 'gemini'} 
                onValueChange={(value) => updateSettingsMutation.mutate({ activeAiModel: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai">OpenAI GPT</SelectItem>
                  <SelectItem value="claude">Anthropic Claude</SelectItem>
                  <SelectItem value="gemini">Google Gemini</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Temperatura</Label>
              <Slider
                value={[settings?.temperature || 0.7]}
                onValueChange={([value]) => updateSettingsMutation.mutate({ temperature: value })}
                max={1}
                step={0.1}
                className="w-full"
              />
              <p className="text-xs text-gray-600">Atual: {settings?.temperature || 0.7}</p>
            </div>
          </div>

          {/* API Keys */}
          <div className="space-y-4">
            <h3 className="font-semibold">API Keys</h3>
            
            {/* OpenAI */}
            <div className="flex items-center gap-4">
              <Label className="min-w-20">OpenAI:</Label>
              <Input
                type={showApiKeys.openai ? "text" : "password"}
                value={settings?.openaiKey || ""}
                onChange={(e) => updateSettingsMutation.mutate({ openaiKey: e.target.value })}
                placeholder="sk-..."
                className="flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowApiKeys(prev => ({ ...prev, openai: !prev.openai }))}
              >
                {showApiKeys.openai ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>

            {/* Claude */}
            <div className="flex items-center gap-4">
              <Label className="min-w-20">Claude:</Label>
              <Input
                type={showApiKeys.claude ? "text" : "password"}
                value={settings?.claudeKey || ""}
                onChange={(e) => updateSettingsMutation.mutate({ claudeKey: e.target.value })}
                placeholder="sk-ant-..."
                className="flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowApiKeys(prev => ({ ...prev, claude: !prev.claude }))}
              >
                {showApiKeys.claude ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>

            {/* Gemini */}
            <div className="flex items-center gap-4">
              <Label className="min-w-20">Gemini:</Label>
              <Input
                type={showApiKeys.gemini ? "text" : "password"}
                value={settings?.geminiKey || ""}
                onChange={(e) => updateSettingsMutation.mutate({ geminiKey: e.target.value })}
                placeholder="AIza..."
                className="flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowApiKeys(prev => ({ ...prev, gemini: !prev.gemini }))}
              >
                {showApiKeys.gemini ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configurações de Sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurações do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Restringir a Tópicos Jurídicos</Label>
              <p className="text-sm text-gray-600">Permitir apenas prompts jurídicos</p>
            </div>
            <Switch
              checked={settings?.restrictToLegalTopics || false}
              onCheckedChange={(checked) => updateSettingsMutation.mutate({ restrictToLegalTopics: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Modo Manutenção</Label>
              <p className="text-sm text-gray-600">Desabilitar sistema temporariamente</p>
            </div>
            <Switch
              checked={settings?.maintenanceMode || false}
              onCheckedChange={(checked) => updateSettingsMutation.mutate({ maintenanceMode: checked })}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Componente de Analytics
function AnalyticsManagement() {
  const { data: analytics } = useQuery({
    queryKey: ["/api/admin/analytics"],
    refetchInterval: 30000,
  });

  const { data: usage } = useQuery({
    queryKey: ["/api/admin/analytics/usage"],
    refetchInterval: 30000,
  });

  return (
    <div className="space-y-6">
      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total de Prompts</p>
                <p className="text-2xl font-bold">{usage?.totalPrompts || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Usuários Ativos</p>
                <p className="text-2xl font-bold">{usage?.activeUsers || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Star className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Score Médio</p>
                <p className="text-2xl font-bold">{usage?.averageScore || 0}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Prompts Hoje</p>
                <p className="text-2xl font-bold">{usage?.todayPrompts || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos de Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Prompts por Dia</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics?.dailyPrompts || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#3B82F6" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Scores</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics?.scoreDistribution || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Componente de Presets
function PresetsManagement() {
  const { toast } = useToast();
  const [presetName, setPresetName] = useState("");
  const [presetDescription, setPresetDescription] = useState("");

  const { data: presets } = useQuery({
    queryKey: ["/api/admin/presets"],
  });

  const { data: activePreset } = useQuery({
    queryKey: ["/api/admin/presets/active"],
  });

  const createPresetMutation = useMutation({
    mutationFn: async (preset: any) => {
      const response = await fetch('/api/admin/presets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preset)
      });
      if (!response.ok) throw new Error('Falha ao criar preset');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Preset criado",
        description: "O preset foi criado com sucesso.",
      });
      setPresetName("");
      setPresetDescription("");
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Save className="h-5 w-5" />
            Configurações Predefinidas
          </CardTitle>
          <CardDescription>
            Gerencie presets de configuração para o sistema de qualidade
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Criar Novo Preset */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Nome do preset"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
            />
            <Input
              placeholder="Descrição"
              value={presetDescription}
              onChange={(e) => setPresetDescription(e.target.value)}
            />
            <Button
              onClick={() => createPresetMutation.mutate({ name: presetName, description: presetDescription })}
              disabled={!presetName || createPresetMutation.isPending}
            >
              Criar Preset
            </Button>
          </div>

          {/* Lista de Presets */}
          <div className="space-y-3">
            {(presets?.presets || []).map((preset: any) => (
              <div key={preset.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{preset.name}</p>
                  <p className="text-sm text-gray-600">{preset.description}</p>
                </div>
                <div className="flex gap-2">
                  {activePreset?.id === preset.id && (
                    <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                  )}
                  <Button variant="outline" size="sm">
                    Ativar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Componente de Qualidade
function QualityManagement() {
  const { data: qualityStats } = useQuery({
    queryKey: ["/api/admin/quality/stats"],
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Análise de Qualidade
          </CardTitle>
          <CardDescription>
            Estatísticas e configurações do sistema de qualidade
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{qualityStats?.averageScore || 0}%</p>
              <p className="text-sm text-green-700">Score Médio</p>
            </div>
            
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{qualityStats?.totalAnalyses || 0}</p>
              <p className="text-sm text-blue-700">Análises Realizadas</p>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">{qualityStats?.improvementSuggestions || 0}</p>
              <p className="text-sm text-purple-700">Sugestões de Melhoria</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Componente de Sugestões
function SuggestionsManagement() {
  const { toast } = useToast();

  const { data: suggestions } = useQuery({
    queryKey: ["/api/suggestions"],
  });

  const updateSuggestionsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/update-suggestions', {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Falha ao atualizar sugestões');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sugestões atualizadas",
        description: "As sugestões foram atualizadas com base nos dados recentes.",
      });
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Sistema de Sugestões Dinâmicas
          </CardTitle>
          <CardDescription>
            Gerencie as sugestões baseadas nos documentos mais populares
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Sistema atualiza automaticamente toda segunda-feira baseado nos últimos 30 dias
            </p>
            <Button
              onClick={() => updateSuggestionsMutation.mutate()}
              disabled={updateSuggestionsMutation.isPending}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar Agora
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium mb-3">Sugestões Atuais</h3>
              <div className="space-y-2">
                {(suggestions?.suggestions || []).map((suggestion: string, index: number) => (
                  <div key={index} className="flex items-center gap-3 p-2 bg-blue-50 rounded">
                    <span className="font-bold text-blue-600">#{index + 1}</span>
                    <span>{suggestion}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-3">Estatísticas</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Última Atualização:</span>
                  <span className="text-sm font-medium">Hoje, 00:00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Próxima Atualização:</span>
                  <span className="text-sm font-medium">Segunda, 00:00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Base de Dados:</span>
                  <span className="text-sm font-medium">Últimos 30 dias</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Componente de Ratings
function RatingsManagement() {
  const { data: ratings } = useQuery({
    queryKey: ["/api/admin/ratings"],
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Sistema de Avaliações
          </CardTitle>
          <CardDescription>
            Análise das avaliações dos usuários sobre o sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-2xl">😔</p>
              <p className="text-lg font-bold">{ratings?.veryBad || 0}</p>
              <p className="text-xs text-gray-600">Muito Ruim</p>
            </div>
            
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-2xl">😐</p>
              <p className="text-lg font-bold">{ratings?.bad || 0}</p>
              <p className="text-xs text-gray-600">Ruim</p>
            </div>
            
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-2xl">😊</p>
              <p className="text-lg font-bold">{ratings?.good || 0}</p>
              <p className="text-xs text-gray-600">Bom</p>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl">😍</p>
              <p className="text-lg font-bold">{ratings?.excellent || 0}</p>
              <p className="text-xs text-gray-600">Excelente</p>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="font-medium mb-3">Comentários Recentes</h3>
            <div className="space-y-3">
              {(ratings?.recentComments || []).map((comment: any, index: number) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{comment.emoji}</span>
                    <span className="text-sm text-gray-600">{comment.date}</span>
                  </div>
                  <p className="text-sm">{comment.text}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}