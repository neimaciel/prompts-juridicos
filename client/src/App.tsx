import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import UpdateNotification from "@/components/update-notification";
// import FloatingContractButton from "@/components/floating-contract-button";
import Home from "@/pages/home";
import AdminPanel from "@/pages/admin";
import LoginPage from "@/pages/login";
import TermsPage from "@/pages/terms";
import ContractAnalysis from "@/pages/contract-analysis";
import UpdatesPage from "@/pages/updates";
import BuyTokens from "@/pages/buy-tokens";
import SaoPauloPage from "@/pages/sao-paulo";
import { useEffect } from "react";
import { initGA } from "./lib/analytics";
function Router() {
  // Router functionality
  
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/gerador" component={Home} />
      <Route path="/login" component={LoginPage} />
      <Route path="/admin" component={AdminPanel} />
      <Route path="/termos" component={TermsPage} />
      <Route path="/contratos" component={ContractAnalysis} />
      <Route path="/docsmart" component={ContractAnalysis} />
      <Route path="/updates" component={UpdatesPage} />
      <Route path="/atualizacoes" component={UpdatesPage} />
      <Route path="/comprar-tokens" component={BuyTokens} />
      <Route path="/sao-paulo" component={SaoPauloPage} />
      <Route>
        <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">404 - Página não encontrada</h1>
            <p className="text-gray-600">A página que você está procurando não existe.</p>
          </div>
        </div>
      </Route>
    </Switch>
  );
}

function App() {
  // Initialize Google Analytics when app loads
  useEffect(() => {
    // Verify required environment variable is present
    if (!import.meta.env.VITE_GA_MEASUREMENT_ID) {
      console.warn('Missing required Google Analytics key: VITE_GA_MEASUREMENT_ID');
    } else {
      initGA();
    }

    // Global error handler for unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.warn('Unhandled promise rejection:', event.reason);
      event.preventDefault(); // Prevent the default behavior
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
        <UpdateNotification />

      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
