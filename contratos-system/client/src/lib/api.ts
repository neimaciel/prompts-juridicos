const API_BASE_URL = '/docsmart/api';

interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { error: errorData.error || 'Erro na requisição' };
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      return { error: 'Erro de conexão com o servidor' };
    }
  }

  // Auth endpoints
  async login(email: string, password: string) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(email: string, password: string) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async logout() {
    return this.request('/api/auth/logout', {
      method: 'POST',
    });
  }

  async getProfile() {
    return this.request('/api/auth/profile');
  }

  // Contract analysis endpoints
  async uploadContract(file: File) {
    const formData = new FormData();
    formData.append('contract', file);

    return fetch(`${API_BASE_URL}/api/contracts/upload`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
  }

  async analyzeContract(contractId: string) {
    return this.request(`/api/contracts/${contractId}/analyze`, {
      method: 'POST',
    });
  }

  async getAnalysis(analysisId: string) {
    return this.request(`/api/contracts/analysis/${analysisId}`);
  }

  async getContractHistory(page = 1, limit = 20) {
    return this.request(`/api/contracts/history?page=${page}&limit=${limit}`);
  }

  // Token management
  async getTokenBalance() {
    return this.request('/api/tokens/balance');
  }

  async getTokenHistory(page = 1, limit = 20) {
    return this.request(`/api/tokens/history?page=${page}&limit=${limit}`);
  }

  // Subscription management
  async getSubscriptionPlans() {
    return this.request('/api/subscription/plans');
  }

  async createCheckoutSession(planId: string) {
    return this.request('/api/subscription/create-checkout', {
      method: 'POST',
      body: JSON.stringify({ planId }),
    });
  }

  async createPortalSession() {
    return this.request('/api/subscription/portal', {
      method: 'POST',
    });
  }

  // Sensitive data operations
  async encryptSensitiveData(contractId: string) {
    return this.request(`/api/contracts/${contractId}/encrypt`, {
      method: 'POST',
    });
  }

  async decryptSensitiveData(contractId: string) {
    return this.request(`/api/contracts/${contractId}/decrypt`, {
      method: 'POST',
    });
  }

  async replaceFictionalData(contractId: string) {
    return this.request(`/api/contracts/${contractId}/fictional`, {
      method: 'POST',
    });
  }
}

export const api = new ApiClient();
export default api;