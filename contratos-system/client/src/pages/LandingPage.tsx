import { useState } from 'react';
import { Link } from 'wouter';
import { FileText, Shield, Zap, CheckCircle, ArrowRight, Star } from 'lucide-react';
// Define subscription plans locally
const SUBSCRIPTION_PLANS = [
  {
    id: 'free',
    name: 'Gratuito',
    price: 0,
    tokens: 500,
    popular: false,
    features: [
      'Análise básica de contratos',
      'Relatórios em PDF',
      'Suporte por email',
      'Detecção de dados sensíveis'
    ]
  },
  {
    id: 'professional',
    name: 'Profissional',
    price: 49.90,
    tokens: 5000,
    popular: true,
    features: [
      'Análise avançada com IA',
      'Criptografia de dados sensíveis',
      'Relatórios detalhados',
      'Suporte prioritário',
      'API de integração',
      'Histórico ilimitado'
    ]
  },
  {
    id: 'enterprise',
    name: 'Empresarial',
    price: 199.90,
    tokens: 25000,
    popular: false,
    features: [
      'Análise ilimitada',
      'Criptografia corporativa',
      'Dashboard personalizado',
      'Suporte 24/7',
      'API completa',
      'Relatórios customizados',
      'Integração com sistemas'
    ]
  }
];

export default function LandingPage() {
  const [selectedPlan, setSelectedPlan] = useState('professional');

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <header className="relative overflow-hidden bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Análise Inteligente de
              <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                {" "}Contratos
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 mb-8 max-w-3xl mx-auto">
              IA Avançada para detectar riscos, avaliar conformidade legal e gerar relatórios detalhados dos seus contratos
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login">
                <button className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 flex items-center justify-center">
                  Começar Análise Gratuita
                  <ArrowRight className="ml-2 h-5 w-5" />
                </button>
              </Link>
              <button className="px-8 py-4 border-2 border-white/30 text-white font-semibold rounded-lg hover:bg-white/10 transition-all duration-200">
                Ver Demonstração
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Por que escolher nossa plataforma?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Tecnologia de ponta para análise jurídica com foco na legislação brasileira
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8 rounded-xl bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-100">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Proteção LGPD</h3>
              <p className="text-gray-600">
                Criptografia nativa para dados sensíveis. Sua informação permanece protegida durante toda a análise.
              </p>
            </div>

            <div className="text-center p-8 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100">
              <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Análise Rápida</h3>
              <p className="text-gray-600">
                Resultado em minutos com score detalhado e identificação automática de riscos contratuais.
              </p>
            </div>

            <div className="text-center p-8 rounded-xl bg-gradient-to-br from-orange-50 to-yellow-50 border border-orange-100">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-600 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Relatórios Completos</h3>
              <p className="text-gray-600">
                Relatórios detalhados em PDF com recomendações específicas para melhorar seus contratos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Planos Flexíveis
            </h2>
            <p className="text-xl text-gray-600">
              Escolha o plano ideal para suas necessidades
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {SUBSCRIPTION_PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`relative p-8 rounded-xl border-2 transition-all duration-200 ${
                  plan.popular
                    ? 'border-purple-500 shadow-xl scale-105'
                    : 'border-gray-200 hover:border-purple-300'
                } ${selectedPlan === plan.id ? 'ring-2 ring-purple-500' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Mais Popular
                    </span>
                  </div>
                )}

                <div className="text-center">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-gray-900">
                      {plan.price === 0 ? 'Grátis' : `R$ ${plan.price.toFixed(2)}`}
                    </span>
                    {plan.price > 0 && <span className="text-gray-600">/mês</span>}
                  </div>
                  <p className="text-gray-600 mb-6">{plan.tokens.toLocaleString()} tokens mensais</p>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-gray-700">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link href="/login">
                    <button
                      className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${
                        plan.popular
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700'
                          : 'bg-gray-900 text-white hover:bg-gray-800'
                      }`}
                    >
                      {plan.price === 0 ? 'Começar Grátis' : 'Escolher Plano'}
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              O que nossos clientes dizem
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                name: "Dr. Carlos Silva",
                role: "Advogado Empresarial",
                content: "A análise de contratos economizou horas do meu trabalho. A detecção de riscos é impressionante.",
                rating: 5
              },
              {
                name: "Dra. Marina Santos",
                role: "Sócia em Escritório",
                content: "Perfeito para revisar contratos rapidamente. Os relatórios são muito detalhados e úteis.",
                rating: 5
              },
              {
                name: "Roberto Oliveira",
                role: "Consultor Jurídico",
                content: "A criptografia de dados me dá total confiança para analisar contratos sensíveis dos clientes.",
                rating: 5
              }
            ].map((testimonial, index) => (
              <div key={index} className="p-6 rounded-xl bg-gray-50 border border-gray-200">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4">"{testimonial.content}"</p>
                <div>
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-600">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-900 to-blue-900">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Pronto para analisar seus contratos?
          </h2>
          <p className="text-xl text-gray-200 mb-8">
            Comece gratuitamente e experimente o poder da análise jurídica com IA
          </p>
          <Link href="/login">
            <button className="px-8 py-4 bg-white text-purple-900 font-semibold rounded-lg hover:bg-gray-100 transition-all duration-200 inline-flex items-center">
              Começar Agora
              <ArrowRight className="ml-2 h-5 w-5" />
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">Análise de Contratos</h3>
            <p className="text-gray-400 mb-4">
              Parte do ecossistema Prompts Jurídicos
            </p>
            <p className="text-sm text-gray-500">
              © 2025 Prompts Jurídicos. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}