import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface FAQItem {
  question: string;
  answer: string;
  category?: string;
}

const faqData: FAQItem[] = [
  {
    question: "O que são prompts jurídicos?",
    answer: "Prompts jurídicos são instruções específicas para inteligência artificial gerar documentos legais como contratos, petições, pareceres e notificações. Nossa plataforma utiliza IA especializada em direito brasileiro para criar documentos profissionais e conformes com a legislação.",
    category: "Básico"
  },
  {
    question: "Como funciona a geração automática de contratos?",
    answer: "O sistema utiliza inteligência artificial Claude 3.5 Sonnet e Gemini 1.5 Flash para analisar sua solicitação e gerar documentos jurídicos. O processo inclui: 1) Análise da solicitação, 2) Detecção do tipo de documento, 3) Geração personalizada, 4) Análise de qualidade com scoring inteligente.",
    category: "Funcionalidade"
  },
  {
    question: "É seguro usar IA para documentos legais?",
    answer: "Sim, nossa plataforma implementa proteção LGPD completa, detecção automática de dados sensíveis e sistema de scoring para garantir qualidade. Todos os documentos gerados devem ser revisados por profissional do direito antes do uso. A IA serve como assistente especializado, não substitui a análise jurídica profissional.",
    category: "Segurança"
  },
  {
    question: "Quais tipos de documentos posso gerar?",
    answer: "A plataforma gera 6 tipos principais: Contratos (locação, compra e venda, prestação de serviços), Petições Iniciais, Pareceres Jurídicos, Notificações Extrajudiciais, Documentos Trabalhistas e Pesquisas Genealógicas. Cada tipo tem análise especializada com pesos específicos de avaliação.",
    category: "Funcionalidade"
  },
  {
    question: "Como funciona o sistema de pontuação de qualidade?",
    answer: "Nosso sistema de scoring inteligente avalia 4 critérios: Completude Legal (30%), Conformidade Legislativa (25%), Aplicabilidade Prática (25%) e Estrutura Legal (20%). Os pesos se adaptam automaticamente ao tipo de documento detectado, garantindo avaliação contextual apropriada.",
    category: "Qualidade"
  },
  {
    question: "Posso melhorar um documento gerado?",
    answer: "Sim! O sistema de melhoria colaborativa permite refinamento iterativo com sugestões baseadas em regras + IA contextual. Você pode selecionar, editar e personalizar sugestões, além de adicionar requisitos próprios. Cada regeneração inclui novo scoring e histórico completo.",
    category: "Melhoria"
  },
  {
    question: "A plataforma é gratuita?",  
    answer: "Sim, oferecemos geração gratuita de prompts jurídicos com análise de qualidade inclusa. Para análise de contratos com criptografia no DocSmart, oferecemos planos: Gratuito (500 tokens), Profissional (5000 tokens, R$49,90) e Empresarial (25000 tokens, R$199,90).",
    category: "Preços"
  },
  {
    question: "Como a plataforma protege meus dados?",
    answer: "Implementamos proteção LGPD completa com detecção automática de CPF, CNPJ, endereços e telefones. No DocSmart, utilizamos criptografia AES-256-GCM para dados sensíveis. Todos os dados são processados em servidores seguros e não são compartilhados com terceiros.",
    category: "Segurança"
  }
];

export default function FAQSection() {
  const [openItems, setOpenItems] = useState<number[]>([]);

  const toggleItem = (index: number) => {
    setOpenItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  // Group FAQs by category
  const categories = Array.from(new Set(faqData.map(item => item.category || 'Geral')));

  return (
    <div className="space-y-8">
      {/* SEO-optimized structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": faqData.map(item => ({
              "@type": "Question",
              "name": item.question,
              "acceptedAnswer": {
                "@type": "Answer",
                "text": item.answer
              }
            }))
          })
        }}
      />

      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Perguntas Frequentes
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Tire suas dúvidas sobre nossa plataforma de geração de documentos jurídicos com inteligência artificial
        </p>
      </div>

      {categories.map(category => {
        const categoryItems = faqData.filter(item => (item.category || 'Geral') === category);
        
        return (
          <Card key={category} className="w-full">
            <CardHeader>
              <CardTitle className="text-xl text-blue-900">
                {category}
              </CardTitle>
              <CardDescription>
                {category === 'Básico' && 'Informações fundamentais sobre a plataforma'}
                {category === 'Funcionalidade' && 'Como usar os recursos da plataforma'}
                {category === 'Segurança' && 'Proteção de dados e conformidade LGPD'}
                {category === 'Qualidade' && 'Sistema de análise e pontuação'}
                {category === 'Melhoria' && 'Refinamento colaborativo de documentos'}
                {category === 'Preços' && 'Planos e custos da plataforma'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {categoryItems.map((item, index) => {
                const globalIndex = faqData.indexOf(item);
                const isOpen = openItems.includes(globalIndex);
                
                return (
                  <Collapsible key={globalIndex}>
                    <CollapsibleTrigger 
                      onClick={() => toggleItem(globalIndex)}
                      className="flex w-full items-center justify-between rounded-lg bg-gray-50 px-4 py-3 text-left font-medium hover:bg-gray-100 transition-colors"
                    >
                      <span className="text-sm font-semibold text-gray-900">
                        {item.question}
                      </span>
                      {isOpen ? (
                        <ChevronUp className="h-4 w-4 text-gray-500" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                      )}
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-4 py-3">
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {item.answer}
                      </p>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}