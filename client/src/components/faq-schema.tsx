import React from 'react';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSchemaProps {
  faqs: FAQItem[];
  className?: string;
}

export const FAQSchema: React.FC<FAQSchemaProps> = ({ faqs, className = "" }) => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData)
        }}
      />
      
      <section className={`space-y-6 ${className}`}>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Perguntas Frequentes
        </h2>
        
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div 
              key={index} 
              className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm"
              itemScope 
              itemType="https://schema.org/Question"
            >
              <h3 
                className="text-lg font-semibold text-gray-900 mb-3"
                itemProp="name"
              >
                {faq.question}
              </h3>
              <div 
                itemScope 
                itemType="https://schema.org/Answer" 
                itemProp="acceptedAnswer"
              >
                <div 
                  className="text-gray-700 leading-relaxed"
                  itemProp="text"
                  dangerouslySetInnerHTML={{ __html: faq.answer }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
};

// FAQs otimizadas para Voice Search e SEO Jurídico
export const legalFAQs: FAQItem[] = [
  {
    question: "Como fazer uma petição inicial trabalhista?",
    answer: "Para fazer uma petição inicial trabalhista você precisa: <br/>1. Identificar as partes (requerente e requerido)<br/>2. Descrever os fatos que motivam o pedido<br/>3. Fundamentar juridicamente com base na CLT<br/>4. Fazer o pedido específico de forma clara<br/>5. Atribuir valor à causa<br/>6. Anexar documentos comprobatórios"
  },
  {
    question: "Quanto tempo demora para gerar um meta prompt jurídico com IA?",
    answer: "Com nossa plataforma, a geração de meta prompts avançados é instantânea. Prompts otimizados para contratos, petições e pareceres são criados em menos de 30 segundos, prontos para usar no LLM de sua escolha (ChatGPT, Claude, Gemini, etc.)."
  },
  {
    question: "Os meta prompts seguem a legislação brasileira?",
    answer: "Sim, todos os meta prompts são criados considerando a legislação brasileira vigente. Nossa IA especializada inclui contexto sobre CLT, Código Civil, CPC e outras normas específicas, gerando prompts que orientam qualquer LLM a produzir conteúdo jurídico brasileiro adequado."
  },
  {
    question: "Posso usar os meta prompts em qualquer LLM?",
    answer: "Sim! Nossos meta prompts são compatíveis com ChatGPT, Claude, Gemini e outros LLMs principais. Eles fornecem contexto jurídico brasileiro detalhado que qualquer advogado pode usar para gerar documentos específicos no LLM de sua preferência."
  },
  {
    question: "Qual a diferença entre contrato de trabalho e prestação de serviços?",
    answer: "O contrato de trabalho estabelece vínculo empregatício com direitos trabalhistas (FGTS, férias, 13º salário). O contrato de prestação de serviços é para trabalho autônomo, sem vínculo empregatício e com maior autonomia na execução."
  },
  {
    question: "Como calcular rescisão trabalhista em 2025?",
    answer: "A rescisão trabalhista inclui: saldo de salário, aviso prévio (30 dias + 3 dias por ano trabalhado), férias proporcionais + 1/3, 13º salário proporcional, FGTS + 40% (demissão sem justa causa), e outros direitos conforme o caso."
  },
  {
    question: "Preciso ser advogado para usar a plataforma?",
    answer: "Não é necessário ser advogado. A plataforma é intuitiva e pode ser usada por empresários, profissionais liberais, estudantes de direito e qualquer pessoa que precise de documentos jurídicos profissionais."
  },
  {
    question: "Os meta prompts têm garantia de qualidade?",
    answer: "Sim, oferecemos sistema de análise de qualidade com scoring inteligente. Todos os meta prompts passam por verificação de adequação legal e podem ser melhorados colaborativamente pelos usuários para otimizar os resultados nos LLMs."
  }
];

export default FAQSchema;