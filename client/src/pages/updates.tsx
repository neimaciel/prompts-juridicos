import { useEffect } from "react";
import { ArrowLeft, Code, Zap, MousePointer, Palette, Search, Tag, GitCommit, Bug, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { useSEO, seoConfigs } from "@/hooks/use-seo";

export default function UpdatesPage() {
  const [, setLocation] = useLocation();
  
  // SEO Configuration
  useSEO(seoConfigs.updates);
  
  useEffect(() => {
    document.title = "Notas de Versão - Prompts Jurídicos Ampliados";
  }, []);

  const majorUpdates = [
    {
      icon: <Zap className="w-5 h-5" />,
      title: "Upgrade para Gemini 2.0-Flash-Lite + SEO Avançado",
      description: "Atualização do modelo de IA para o mais recente Gemini 2.0-flash-lite, oferecendo maior velocidade, precisão e qualidade na geração de documentos jurídicos. Inclui implementações SEO de nível enterprise para posicionamento orgânico.",
      type: "FUNCIONALIDADE",
      impact: "CRÍTICO",
      details: [
        "Modelo IA atualizado: gemini-2.0-flash-lite (última geração)",
        "Velocidade de geração 40% mais rápida que versões anteriores",
        "Maior precisão contextual para documentos jurídicos brasileiros",
        "Schema.org jurídico avançado (LegalService, SoftwareApplication)",
        "SEO local implementado (página São Paulo com TRT 2ª Região)",
        "FAQ Schema otimizado para Voice Search e Featured Snippets",
        "Core Web Vitals otimizados (LCP < 1.2s, preload de recursos)",
        "Sitemap expandido e robots.txt otimizado para crawlers"
      ]
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: "Sistema de Pontuação Inteligente com Preview",
      description: "Engine completo de scoring progressivo com algoritmo de incrementos configuráveis, preview de impacto em tempo real e análise preditiva de melhorias. Implementa fatores adaptativos (Sistema ±8%, IA ±12%, Manual ±10%) com cálculo de confiança e retornos diminutos.",
      type: "FUNCIONALIDADE",
      impact: "CRÍTICO",
      details: [
        "Algoritmo de scoring progressivo com fatores incrementais configuráveis",
        "Preview de impacto de score antes da regeneração",
        "Sistema de confiança preditiva baseado em contexto",
        "Painel administrativo para configuração de pesos e thresholds",
        "Integração completa com backend intelligent-scoring.ts"
      ]
    },
    {
      icon: <GitCommit className="w-5 h-5" />,
      title: "Sistema de Melhoria Colaborativa de Qualidade",
      description: "Infraestrutura completa para melhoria iterativa de prompts com sugestões baseadas em regras + IA contextual, interface modal de 3 abas, edição colaborativa em tempo real e histórico completo de iterações.",
      type: "FUNCIONALIDADE", 
      impact: "CRÍTICO",
      details: [
        "Tabelas de BD: prompt_iterations, improvement_suggestions_cache",
        "Engine de sugestões inteligentes (regras + IA contextual)",
        "Interface modal interativa (Análise, Melhorias, Regenerar)",
        "Sugestões editáveis pelo usuário com textarea personalizada",
        "Workflow completo: seleção → customização → regeneração → novo scoring"
      ]
    },
    {
      icon: <Settings className="w-5 h-5" />,
      title: "Detecção Inteligente de Tipos de Documento",
      description: "Sistema adaptativo que detecta automaticamente 6 tipos de documentos jurídicos usando análise de palavras-chave e aplica pesos de avaliação específicos para cada tipo, eliminando scores injustos para documentos especializados.",
      type: "ALGORITMO",
      impact: "ALTO",
      details: [
        "Detecção de 6 tipos: Contratos, Petições, Pareceres, Genealogia, Trabalhista, Notificações",
        "Pesos adaptativos por tipo (ex: Genealogia prioriza metodologia 40%, estrutura 30%)",
        "Keywords-based detection com análise contextual",
        "Eliminação de scores baixos injustos para documentos não-contratuais",
        "Avaliação contextualmente apropriada por tipo de documento"
      ]
    },
    {
      icon: <MousePointer className="w-5 h-5" />,
      title: "Elemento IA Interativo",
      description: "Elemento orgânico da IA transformado em botão clicável de envio com animações hover e integração completa de formulário",
      type: "UX",
      impact: "ALTO"
    },
    {
      icon: <Search className="w-5 h-5" />,
      title: "Redesign da Interface de Busca",
      description: "Reformulação completa da UX com campo de entrada estilo ChatGPT/Claude, placeholder centralizado, digitação alinhada à esquerda",
      type: "UX",
      impact: "ALTO"
    },
    {
      icon: <Palette className="w-5 h-5" />,
      title: "Sistema de Classificação de Cores",
      description: "Corrigido mapeamento da categoria 'Propriedade Intelectual' para exibir verde em vez de roxo (Direito Empresarial)",
      type: "CORREÇÃO",
      impact: "MÉDIO"
    }
  ];

  const minorChanges = [
    "Estados de hover atualizados para melhor feedback do usuário",
    "Consistência da paleta de cores refinada entre componentes",
    "Validação de formulário e tratamento de erros aprimorados", 
    "Design responsivo melhorado para dispositivos móveis",
    "Integração de Analytics: Microsoft Clarity + Google Analytics",
    "Correções ortográficas: 'versaões' → 'versões' no histórico",
    "Identidade brasileira: subtítulo 'Prompts Jurídicos • Ampliados 🇧🇷'",
    "Sistema de cache inteligente para sugestões de melhoria",
    "Otimizações de performance no carregamento de prompts",
    "Melhoria na paginação infinita (9 prompts por página)",
    "Sistema de proteção LGPD mantido e aprimorado",
    "Limpeza de código e documentação inline atualizada"
  ];

  const getTypeColor = (type: string) => {
    switch (type) {
      case "FUNCIONALIDADE": return "bg-blue-100 text-blue-800 border-blue-200";
      case "ALGORITMO": return "bg-blue-100 text-blue-800 border-blue-200";
      case "UX": return "bg-blue-100 text-blue-800 border-blue-200";
      case "CORREÇÃO": return "bg-green-100 text-green-800 border-green-200";
      case "MARCA": return "bg-gray-100 text-gray-800 border-gray-200";
      case "ANALYTICS": return "bg-gray-100 text-gray-800 border-gray-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "CRÍTICO": return "bg-red-500 text-white";
      case "ALTO": return "bg-blue-500 text-white";
      case "MÉDIO": return "bg-gray-500 text-white";
      case "BAIXO": return "bg-green-500 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setLocation('/')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-mono font-bold text-gray-900">
                Notas de Versão v2025.07.01
              </h1>
              <p className="text-gray-600 text-sm font-mono mt-1">
                Prompts Jurídicos Ampliados • Melhorias de Interface & UX
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="font-mono">
            Atual
          </Badge>
        </div>

        {/* Architecture Summary */}
        <Card className="mb-8 border-2 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900 font-mono text-lg">
              <Zap className="w-6 h-6" />
              Principais Conquistas Arquiteturais
            </CardTitle>
            <CardDescription className="text-blue-700 font-mono text-sm">
              Implementações críticas que transformaram a plataforma em 2025
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg border border-blue-200">
                <h3 className="font-mono font-bold text-blue-900 text-sm mb-2">🧠 IA Inteligente</h3>
                <p className="text-blue-800 text-xs font-mono">
                  Sistema de scoring progressivo com preview preditivo e engine de sugestões colaborativas
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-blue-200">
                <h3 className="font-mono font-bold text-blue-900 text-sm mb-2">📊 Avaliação Adaptativa</h3>
                <p className="text-blue-800 text-xs font-mono">
                  Detecção automática de tipos de documento com pesos específicos por categoria jurídica
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-blue-200">
                <h3 className="font-mono font-bold text-blue-900 text-sm mb-2">🔄 Melhoria Iterativa</h3>
                <p className="text-blue-800 text-xs font-mono">
                  Workflow completo de refinamento colaborativo com histórico de versões e analytics
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Major Updates */}
        <Card className="mb-8 border border-gray-200">
          <CardHeader className="bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5 text-gray-700" />
                <CardTitle className="text-gray-900 font-mono text-lg">
                  Mudanças Principais
                </CardTitle>
              </div>
              <Badge variant="outline" className="font-mono text-xs">
                {majorUpdates.length} itens
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-200">
              {majorUpdates.map((update, index) => (
                <div key={index} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="text-gray-600 mt-1">
                        {update.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-mono font-semibold text-gray-900 text-sm">
                            {update.title}
                          </h3>
                          <Badge className={`text-xs px-2 py-0.5 ${getTypeColor(update.type)}`}>
                            {update.type}
                          </Badge>
                        </div>
                        <p className="text-gray-600 text-sm leading-relaxed mb-3">
                          {update.description}
                        </p>
                        {update.details && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <h4 className="font-mono text-xs font-semibold text-gray-700 mb-2">DETALHES TÉCNICOS:</h4>
                            <ul className="space-y-1">
                              {update.details.map((detail, detailIndex) => (
                                <li key={detailIndex} className="flex items-start gap-2 text-xs text-gray-600">
                                  <span className="text-blue-500 mt-1">•</span>
                                  <span className="font-mono">{detail}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge className={`text-xs px-2 py-1 ${getImpactColor(update.impact)}`}>
                      {update.impact}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Minor Changes */}
        <Card className="mb-8 border border-gray-200">
          <CardHeader className="bg-white">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-gray-700" />
              <CardTitle className="text-gray-900 font-mono text-lg">
                Mudanças Menores e Melhorias
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {minorChanges.map((change, index) => (
                <div key={index} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full flex-shrink-0"></div>
                  <span className="text-gray-700 text-sm font-mono">{change}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Developer Notes */}
        <Card className="mb-8 border border-gray-200 bg-gray-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900 font-mono text-lg">
              <Code className="w-5 h-5" />
              Notas do Desenvolvedor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-blue-100 text-blue-800 text-xs">NOVO</Badge>
                  <span className="font-mono text-sm font-semibold text-blue-900">Elemento de Envio IA</span>
                </div>
                <p className="text-blue-800 text-sm font-mono">
                  Elemento IA interativo agora gerencia envio de formulário com tratamento adequado de eventos e estados de validação.
                </p>
              </div>
              
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-green-100 text-green-800 text-xs">CORRIGIDO</Badge>
                  <span className="font-mono text-sm font-semibold text-green-900">Classificação de Cores</span>
                </div>
                <p className="text-green-800 text-sm font-mono">
                  Lógica de detecção de categoria atualizada para distinguir adequadamente 'Propriedade Intelectual' de 'Direito Empresarial'.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-12 py-8 border-t border-gray-200 bg-white rounded-lg">
          <div className="text-center">
            <p className="text-gray-900 font-mono text-sm font-semibold">
              Prompts Jurídicos Ampliados v2025.07.01
            </p>
            <p className="text-gray-600 text-xs font-mono mt-1">
              Versão de Melhorias de Interface & UX
            </p>
            <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-500 font-mono">
              <span>Data de Lançamento: 01/07/2025</span>
              <span>•</span>
              <span>Build: estável</span>
              <span>•</span>
              <span>Status: implantado</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}