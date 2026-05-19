import React from 'react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { useSEO } from '@/hooks/use-seo';
import { FAQSchema, legalFAQs } from '@/components/faq-schema';
import Breadcrumbs from '@/components/breadcrumbs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocation } from 'wouter';
import { MapPin, Scale, FileText, Users, Clock, Shield } from 'lucide-react';

const SaoPauloPage: React.FC = () => {
  const [, setLocation] = useLocation();

  // SEO otimizado para São Paulo
  useSEO({
    title: 'Documentos Jurídicos em São Paulo | IA Especializada | Prompts Jurídicos',
    description: 'Gere contratos, petições e pareceres jurídicos em São Paulo com IA especializada. Adaptado ao TRT 2ª Região e tribunais paulistas. Direito trabalhista, civil e empresarial.',
    keywords: 'documentos jurídicos são paulo, advogado são paulo, contratos são paulo, petição trabalhista sp, TRT 2 região, direito são paulo, advocacia são paulo',
    canonical: 'https://promptsjuridicos.com.br/sao-paulo',
    ogTitle: 'Documentos Jurídicos São Paulo | IA Jurídica Especializada',
    ogDescription: 'Contratos, petições e pareceres adaptados aos tribunais de São Paulo. IA especializada em direito brasileiro.',
    ogUrl: 'https://promptsjuridicos.com.br/sao-paulo',
    structuredData: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "Documentos Jurídicos em São Paulo",
      "description": "Serviços de geração de documentos jurídicos com IA especializada para São Paulo",
      "url": "https://promptsjuridicos.com.br/sao-paulo",
      "mainEntity": {
        "@type": "LegalService",
        "serviceArea": {
          "@type": "City",
          "name": "São Paulo", 
          "containedIn": "SP, Brasil"
        },
        "availableAtOrFrom": {
          "@type": "VirtualLocation",
          "url": "https://promptsjuridicos.com.br/sao-paulo"
        },
        "serviceType": "Legal Document Generation",
        "provider": {
          "@type": "Organization",
          "name": "Prompts Jurídicos Ampliados"
        }
      }
    }
  });

  const breadcrumbItems = [
    { label: 'São Paulo', href: '/sao-paulo', current: true }
  ];

  const spFeatures = [
    {
      icon: Scale,
      title: "Tribunais de São Paulo", 
      description: "Documentos adaptados ao TRT 2ª Região, TJSP e demais tribunais paulistas"
    },
    {
      icon: FileText,
      title: "Legislação Local",
      description: "Consideramos leis municipais e estaduais específicas de São Paulo"
    },
    {
      icon: Users,
      title: "Escritórios SP",
      description: "Ideal para advogados e escritórios que atuam na Grande São Paulo"
    },
    {
      icon: Clock,
      title: "Agilidade Metropolitana",
      description: "Documentos gerados instantaneamente para o ritmo acelerado da capital"
    },
    {
      icon: Shield,
      title: "Compliance SP",
      description: "Adequação às normas da OAB-SP e regulamentações locais"
    },
    {
      icon: MapPin,
      title: "Cobertura Regional", 
      description: "Atendemos toda a Região Metropolitana de São Paulo"
    }
  ];

  const spFAQs = [
    {
      question: "Os documentos são adaptados aos tribunais de São Paulo?",
      answer: "Sim, todos os documentos consideram as especificidades dos tribunais paulistas, incluindo TRT 2ª Região, TJSP e práticas locais dos fóruns da capital e interior."
    },
    {
      question: "Como funciona o direito trabalhista em São Paulo?",
      answer: "São Paulo segue a CLT nacional, mas tem jurisprudência específica do TRT 2ª Região. Consideramos precedentes locais, acordos coletivos de categorias paulistas e particularidades do mercado de trabalho da região."
    },
    {
      question: "Vocês conhecem as leis municipais de São Paulo?",
      answer: "Sim, nossa IA considera legislações específicas como IPTU, ISS, ITBI, Lei de Zoneamento, Código de Obras e outras normas municipais relevantes para contratos e documentos jurídicos."
    },
    {
      question: "Quanto custa um advogado em São Paulo?",
      answer: "Os honorários advocatícios em São Paulo variam: consultas R$ 200-500, contratos R$ 500-3.000, petições R$ 800-5.000. Nossa IA reduz custos gerando documentos profissionais por uma fração do valor."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Breadcrumbs */}
          <div className="mb-8">
            <Breadcrumbs items={breadcrumbItems} />
          </div>

          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="flex items-center justify-center mb-6">
              <MapPin className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
                Documentos Jurídicos em <span className="text-blue-600">São Paulo</span>
              </h1>
            </div>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              IA especializada em direito brasileiro com foco nos tribunais paulistas. 
              Gere contratos, petições e pareceres adaptados ao TRT 2ª Região, TJSP e legislação local.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => setLocation('/gerador')}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
              >
                Gerar Documento Agora
              </Button>
              <Button 
                onClick={() => setLocation('/docsmart')}
                variant="outline"
                size="lg"
                className="px-8 py-3 text-lg border-blue-600 text-blue-600 hover:bg-blue-50"
              >
                Analisar Contrato
              </Button>
            </div>
          </div>

          {/* Estatísticas São Paulo */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
            <div className="text-center p-6 bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="text-3xl font-bold text-blue-600 mb-2">1.2M+</div>
              <div className="text-gray-600">Advogados em SP</div>
            </div>
            <div className="text-center p-6 bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="text-3xl font-bold text-blue-600 mb-2">TRT 2ª</div>
              <div className="text-gray-600">Região Trabalhista</div>
            </div>
            <div className="text-center p-6 bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="text-3xl font-bold text-blue-600 mb-2">TJSP</div>
              <div className="text-gray-600">Tribunal de Justiça</div>
            </div>
            <div className="text-center p-6 bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="text-3xl font-bold text-blue-600 mb-2">30s</div>
              <div className="text-gray-600">Geração Instantânea</div>
            </div>
          </div>

          {/* Características SP */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Especializado em São Paulo
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {spFeatures.map((feature, index) => (
                <Card key={index} className="h-full">
                  <CardHeader>
                    <feature.icon className="h-8 w-8 text-blue-600 mb-3" />
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Tipos de Documentos para SP */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Documentos Mais Usados em São Paulo
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Direito Trabalhista</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• Contratos de trabalho CLT</li>
                  <li>• Petições para TRT 2ª Região</li>
                  <li>• Acordos coletivos de categorias SP</li>
                  <li>• Cálculos de rescisão trabalhista</li>
                  <li>• Defesas trabalhistas especializadas</li>
                </ul>
              </Card>
              
              <Card className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Direito Empresarial</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• Contratos comerciais São Paulo</li>
                  <li>• Sociedades e joint ventures</li>
                  <li>• Compliance fiscal municipal</li>
                  <li>• Contratos de locação comercial</li>
                  <li>• Documentos para JUCESP</li>
                </ul>
              </Card>
            </div>
          </div>

          {/* FAQ São Paulo */}
          <FAQSchema faqs={spFAQs} className="mb-16" />

          {/* CTA Final */}
          <div className="text-center bg-blue-600 text-white rounded-2xl p-12">
            <h2 className="text-3xl font-bold mb-4">
              Pronto para Começar em São Paulo?
            </h2>
            <p className="text-xl mb-6 opacity-90">
              Junte-se aos milhares de profissionais que já usam nossa IA jurídica na capital
            </p>
            <Button 
              onClick={() => setLocation('/gerador')}
              size="lg"
              variant="secondary"
              className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 text-lg font-semibold"
            >
              Criar Primeiro Documento Grátis
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SaoPauloPage;