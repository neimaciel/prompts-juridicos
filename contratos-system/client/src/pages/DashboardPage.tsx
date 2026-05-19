import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';
import { 
  FileText, 
  Plus, 
  Coins, 
  CreditCard, 
  History, 
  Shield, 
  TrendingUp,
  Download,
  Calendar,
  User
} from 'lucide-react';

interface DashboardStats {
  totalAnalyses: number;
  tokensUsed: number;
  currentBalance: number;
  lastAnalysis?: Date;
}

interface RecentAnalysis {
  id: number;
  filename: string;
  riskScore: number;
  createdAt: string;
  status: string;
  tokensUsed: number;
}

const DashboardPage = () => {
  const [, navigate] = useLocation();
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalAnalyses: 0,
    tokensUsed: 0,
    currentBalance: 0
  });
  const [recentAnalyses, setRecentAnalyses] = useState<RecentAnalysis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [tokenResponse, historyResponse] = await Promise.all([
        api.getTokenBalance(),
        api.getContractHistory(1, 5)
      ]);

      if (tokenResponse.data) {
        setStats(prev => ({
          ...prev,
          currentBalance: tokenResponse.data.balance,
          tokensUsed: tokenResponse.data.totalUsed || 0,
          totalAnalyses: tokenResponse.data.totalAnalyses || 0
        }));
      }

      if (historyResponse.data) {
        setRecentAnalyses(historyResponse.data.analyses || []);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    try {
      const response = await api.createCheckoutSession('professional');
      if (response.data?.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getRiskColor = (score: number) => {
    if (score > 70) return 'text-red-600 bg-red-100';
    if (score > 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      completed: { label: 'Concluído', class: 'bg-green-100 text-green-800' },
      pending: { label: 'Pendente', class: 'bg-yellow-100 text-yellow-800' },
      error: { label: 'Erro', class: 'bg-red-100 text-red-800' }
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.pending;
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.class}`}>
        {statusInfo.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Shield className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Análise de Contratos</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <User className="h-4 w-4" />
                <span>{user?.email}</span>
              </div>
              
              <div className="flex items-center space-x-2 bg-blue-50 px-3 py-1 rounded-full">
                <Coins className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-700">{stats.currentBalance} tokens</span>
              </div>
              
              <button
                onClick={logout}
                className="text-gray-600 hover:text-gray-900"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <button
            onClick={() => navigate('/analyze')}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-lg shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 transform hover:scale-105"
          >
            <div className="flex items-center justify-center space-x-3">
              <Plus className="h-8 w-8" />
              <div className="text-left">
                <h3 className="text-lg font-semibold">Nova Análise</h3>
                <p className="text-blue-100 text-sm">Fazer upload de contrato</p>
              </div>
            </div>
          </button>

          <button
            onClick={handleUpgrade}
            className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6 rounded-lg shadow-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 transform hover:scale-105"
          >
            <div className="flex items-center justify-center space-x-3">
              <CreditCard className="h-8 w-8" />
              <div className="text-left">
                <h3 className="text-lg font-semibold">Upgrade</h3>
                <p className="text-purple-100 text-sm">Mais tokens disponíveis</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate('/analyze')}
            className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 rounded-lg shadow-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 transform hover:scale-105"
          >
            <div className="flex items-center justify-center space-x-3">
              <History className="h-8 w-8" />
              <div className="text-left">
                <h3 className="text-lg font-semibold">Histórico</h3>
                <p className="text-green-100 text-sm">Ver análises anteriores</p>
              </div>
            </div>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total de Análises</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalAnalyses}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <Coins className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tokens Utilizados</p>
                <p className="text-2xl font-bold text-gray-900">{stats.tokensUsed}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Saldo Atual</p>
                <p className="text-2xl font-bold text-gray-900">{stats.currentBalance}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Plano</p>
                <p className="text-lg font-bold text-gray-900 capitalize">{user?.subscriptionPlan || 'Free'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Analyses */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Análises Recentes</h2>
          </div>
          
          <div className="p-6">
            {recentAnalyses.length > 0 ? (
              <div className="space-y-4">
                {recentAnalyses.map((analysis) => (
                  <div key={analysis.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <FileText className="h-8 w-8 text-blue-600" />
                      <div>
                        <h3 className="font-medium text-gray-900">{analysis.filename}</h3>
                        <p className="text-sm text-gray-500">{formatDate(analysis.createdAt)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(analysis.riskScore)}`}>
                        {analysis.riskScore}% risco
                      </span>
                      
                      {getStatusBadge(analysis.status)}
                      
                      <div className="text-sm text-gray-500">
                        {analysis.tokensUsed} tokens
                      </div>
                      
                      <button className="text-blue-600 hover:text-blue-800">
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma análise ainda</h3>
                <p className="text-gray-500 mb-4">Comece fazendo upload do seu primeiro contrato</p>
                <button
                  onClick={() => navigate('/analyze')}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                >
                  Fazer Upload
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;