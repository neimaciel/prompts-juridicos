import { useState, useEffect } from "react";
import { Sun, Moon, User, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { AuthModal } from "./auth/auth-modal";
import { UserDashboard } from "./auth/user-dashboard";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import BuyTokensButton from "./buy-tokens-button";
import logoPrompts from "@assets/logo-prompts-juridicos.png";

export default function Header() {
  const [isDark, setIsDark] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [animatingLetters, setAnimatingLetters] = useState(false);
  const [currentLetterIndex, setCurrentLetterIndex] = useState(-1);
  const [scramblingLetters, setScramblingLetters] = useState<string[]>([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);

  const ampliadosText = "Ampliados";
  const scrambleChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  
  const { isAuthenticated, user, logout } = useAuth();

  // console.log('Header render:', { showAuthModal, isAuthenticated });

  useEffect(() => {
    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme === 'dark') {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    } else {
      // Default to light mode
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimatingLetters(true);
      setCurrentLetterIndex(0);
      setScramblingLetters(Array(ampliadosText.length).fill(''));
      
      // Anima letra por letra com embaralhamento
      const animateNextLetter = (index: number) => {
        if (index >= ampliadosText.length) {
          setTimeout(() => setAnimatingLetters(false), 500);
          return;
        }
        
        setCurrentLetterIndex(index);
        
        // Embaralha a letra atual por 300ms
        let scrambleCount = 0;
        const scrambleInterval = setInterval(() => {
          setScramblingLetters(prev => {
            const newArray = [...prev];
            newArray[index] = scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
            return newArray;
          });
          
          scrambleCount++;
          if (scrambleCount >= 6) { // 6 embaralhamentos = ~300ms
            clearInterval(scrambleInterval);
            setScramblingLetters(prev => {
              const newArray = [...prev];
              newArray[index] = ampliadosText[index];
              return newArray;
            });
            
            // Próxima letra após 200ms
            setTimeout(() => animateNextLetter(index + 1), 200);
          }
        }, 50);
      };
      
      animateNextLetter(0);
      
    }, 30000); // A cada 30 segundos

    return () => clearInterval(interval);
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    
    if (newTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleAmpliadosClick = () => {
    window.open('https://chat.whatsapp.com/Kv4GsxMYsJ6GiXCYZfeORK', '_blank');
  };

  return (
    <TooltipProvider>
      <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-50 backdrop-blur-sm bg-white/90 dark:bg-gray-900/90">
        <div className="max-w-7xl mx-auto px-1 sm:px-4 lg:px-8">
          <div className="relative flex items-center justify-center h-20 sm:h-24 py-3 sm:py-4">
            {/* Logo centralizado */}
            <div className="text-center">
              <img 
                src={logoPrompts} 
                alt="Prompts Jurídicos" 
                className="h-12 sm:h-16 mx-auto dark:invert transition-all duration-300"
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleAmpliadosClick}
                    className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer font-mono mt-0"
                  >
                    <span className="inline-block">
                      {ampliadosText.split('').map((letter, index) => (
                        <span
                          key={index}
                          className={`inline-block transition-all duration-100 ${
                            animatingLetters && index <= currentLetterIndex 
                              ? 'text-blue-500' 
                              : ''
                          }`}
                        >
                          {animatingLetters && index <= currentLetterIndex 
                            ? (scramblingLetters[index] || letter)
                            : letter
                          }
                        </span>
                      ))}
                    </span>
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Exclusivo para Juristas</p>
                </TooltipContent>
              </Tooltip>
            </div>
            
            {/* Botões de autenticação e tema posicionados absolutamente */}
            <div className="absolute right-0 flex items-center space-x-2">
              {isAuthenticated && user ? (
                <>
                  <BuyTokensButton />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDashboard(true)}
                    className="flex items-center space-x-1 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    <User className="w-4 h-4" />
                    <span className="hidden sm:inline">{user.name?.split(' ')[0] || 'Dashboard'}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={logout}
                    className="text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </>
              ) : (
                // Botão de login temporariamente oculto
                null
              )}
              
              <button 
                onClick={toggleTheme}
                className="p-1.5 sm:p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 opacity-60 hover:opacity-100"
                title={isDark ? "Modo claro" : "Modo escuro"}
              >
                {isDark ? (
                  <Sun className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <Moon className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Modal de Autenticação */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />

      {/* Modal do Dashboard do Usuário */}
      <Dialog open={showDashboard} onOpenChange={setShowDashboard}>
        <DialogContent className="max-w-2xl">
          <UserDashboard onClose={() => setShowDashboard(false)} />
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
