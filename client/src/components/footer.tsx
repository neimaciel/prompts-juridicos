import { useEffect, useState } from "react";

export default function Footer() {
  const [animatingLetters, setAnimatingLetters] = useState(false);
  const [currentLetterIndex, setCurrentLetterIndex] = useState(-1);
  const [scramblingLetters, setScramblingLetters] = useState<string[]>([]);

  const ampliadosText = "Ampliados";
  const scrambleChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

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

  const handleAmpliadosClick = () => {
    window.open('https://chat.whatsapp.com/Kv4GsxMYsJ6GiXCYZfeORK', '_blank');
  };

  return (
    <footer className="bg-gray-900 text-white py-8 sm:py-16 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center">
          <div className="text-center mb-6">
            <h4 className="text-xl font-semibold">Prompts Jurídicos</h4>
            <button
              onClick={handleAmpliadosClick}
              className="text-gray-400 text-sm hover:text-white transition-colors cursor-pointer font-mono"
              title="Exclusivo para Juristas"
            >
              <span className="inline-block">
                {ampliadosText.split('').map((letter, index) => (
                  <span
                    key={index}
                    className={`inline-block transition-all duration-100 ${
                      animatingLetters && index <= currentLetterIndex 
                        ? 'text-blue-400' 
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
            
            <div className="mt-3">
              <a 
                href="/termos" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 text-sm hover:text-blue-400 underline transition-colors"
              >
                Termos de Uso
              </a>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-gray-400 space-y-2">
            <p className="text-xs">&copy; 2025 Prompts Jurídicos. Todos os direitos reservados.</p>
            <p className="text-xs">Feito com visão pela equipe Ampler - 12.098.211/0001-98 | 1 Cor 10:31</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
