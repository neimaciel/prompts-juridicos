import { useState } from 'react';
import { Router, Route, Switch } from 'wouter';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import AnalysisPage from './pages/AnalysisPage';
import LoginPage from './pages/LoginPage';
import { useAuth } from './hooks/useAuth';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Switch>
          <Route path="/" component={LandingPage} />
          <Route path="/login" component={LoginPage} />
          <Route path="/dashboard" component={user ? DashboardPage : () => <LoginPage />} />
          <Route path="/analyze" component={user ? AnalysisPage : () => <LoginPage />} />
          <Route component={() => <div className="text-center p-8">Página não encontrada</div>} />
        </Switch>
      </div>
    </Router>
  );
}

export default App;