import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Shield, Eye, Users, Scale, FileText, Server, Globe, AlertTriangle, Mail } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
            <Scale className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Termos de Uso
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Plataforma Prompts Jurídicos Ampliados
          </p>
          <Badge variant="outline" className="mt-4">
            Versão 1.0 - Atualizado em 02/06/2025
          </Badge>
        </div>

        {/* Introdução destacada */}
        <Card className="mb-8 border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Introdução
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Estes Termos de Uso regulam o acesso e a utilização da plataforma <strong>"Prompts Jurídicos Ampliados"</strong>, 
              sistema online de geração de prompts jurídicos por meio de inteligência artificial (IA). Ao acessar ou utilizar 
              a plataforma, o Usuário concorda com os termos aqui estabelecidos.
            </p>
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Conformidade Legal:</strong> Marco Civil da Internet (Lei nº 12.965/2014), LGPD (Lei nº 13.709/2018), 
                CDC (Lei nº 8.078/1990), Lei de Direitos Autorais (Lei nº 9.610/1998), Código Civil (Lei nº 10.406/2002).
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Definições */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Definições Importantes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Usuário</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Pessoa física ou jurídica que acessa e utiliza a plataforma.
                </p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Prompts Jurídicos</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Sugestões de comandos gerados por IA para auxiliar na elaboração de documentos jurídicos.
                </p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Dados Pessoais</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Dados que identificam ou tornam identificável uma pessoa natural.
                </p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Informação Confidencial</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Qualquer dado sigiloso inserido indevidamente na plataforma.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Natureza do Serviço */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5 text-purple-600" />
              Natureza do Serviço
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300">
                A plataforma oferece geração automatizada de prompts jurídicos com uso de modelos de IA avançados.
              </p>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-blue-600 dark:text-blue-400 font-bold">AI</span>
                  </div>
                  <h4 className="font-semibold text-sm">Claude 3.7 Sonnet</h4>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-green-600 dark:text-green-400 font-bold">AI</span>
                  </div>
                  <h4 className="font-semibold text-sm">Gemini 1.5 Flash</h4>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-orange-600 dark:text-orange-400 font-bold">AI</span>
                  </div>
                  <h4 className="font-semibold text-sm">OpenAI</h4>
                </div>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-1">Importante</h4>
                    <p className="text-amber-700 dark:text-amber-300 text-sm">
                      O serviço tem caráter auxiliar e <strong>não substitui</strong> a consultoria ou atuação de um profissional jurídico.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Funcionalidades */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Funcionalidades Principais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                "Geração automática de documentos e sugestões jurídicas",
                "Análise de qualidade e relevância dos prompts",
                "Sistema de sugestões inteligentes",
                "Galeria pública de prompts",
                "Filtros por tags jurídicas",
                "Exportação para PDF e DOCX",
                "Sistema de busca avançada",
                "Navegação por categorias"
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Dados e Privacidade */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-indigo-600" />
              Dados Coletados e Privacidade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Dados Coletados:</h4>
                  <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <li>• Solicitações jurídicas</li>
                    <li>• Prompts gerados pela IA</li>
                    <li>• Metadados de uso</li>
                    <li>• Avaliações de qualidade</li>
                    <li>• Dados de navegação</li>
                    <li>• Preferências do usuário</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Finalidade:</h4>
                  <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <li>• Aprimoramento da plataforma</li>
                    <li>• Análises estatísticas</li>
                    <li>• Melhorias na qualidade da IA</li>
                    <li>• Pesquisa e desenvolvimento</li>
                  </ul>
                </div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Política de Transparência</h4>
                <p className="text-blue-700 dark:text-blue-300 text-sm">
                  Todos os prompts gerados são <strong>públicos</strong>. Não é permitida a inclusão de dados confidenciais. 
                  Respeitamos integralmente a LGPD.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gerenciamento de Dados */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5 text-gray-600" />
              Gerenciamento de Dados pela Plataforma
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Manutenção do Sistema</h4>
              <p className="text-gray-700 dark:text-gray-300 text-sm mb-3">
                Os administradores da plataforma podem excluir prompts antigos para melhor manutenção do sistema, 
                sem informar quantidades específicas ou fornecer aviso prévio aos usuários.
              </p>
              <div className="flex items-start gap-2 mt-3">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-amber-700 dark:text-amber-300 text-xs">
                  <strong>Importante:</strong> Esta exclusão visa otimizar o desempenho e a qualidade da plataforma, 
                  mantendo sempre os prompts mais relevantes e atualizados.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Limitações e Responsabilidades */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Limitações e Responsabilidades
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
              <ul className="space-y-2 text-orange-800 dark:text-orange-200 text-sm">
                <li>• Os prompts gerados são <strong>sugestões automatizadas</strong></li>
                <li>• A plataforma <strong>não oferece consultoria jurídica</strong></li>
                <li>• Não nos responsabilizamos por prejuízos decorrentes do uso indevido</li>
                <li>• <strong>Recomenda-se revisão por profissional habilitado</strong></li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Obrigações do Usuário */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-teal-600" />
              Obrigações do Usuário
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { icon: "🚫", text: "Não inserir dados confidenciais" },
                { icon: "👁️", text: "Concordar com a publicidade dos prompts" },
                { icon: "⚖️", text: "Respeitar a legislação vigente" },
                { icon: "🛡️", text: "Utilizar a plataforma de forma ética e segura" }
              ].map((obligation, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <span className="text-2xl">{obligation.icon}</span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{obligation.text}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Legislação Aplicável */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-purple-600" />
              Jurisdição e Legislação Aplicável
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300 font-medium">
                Aplica-se a legislação brasileira:
              </p>
              <div className="grid md:grid-cols-2 gap-2 text-sm">
                {[
                  "Marco Civil da Internet (Lei nº 12.965/2014)",
                  "LGPD (Lei nº 13.709/2018)",
                  "CDC (Lei nº 8.078/1990)",
                  "Código Civil (Lei nº 10.406/2002)",
                  "Lei de Direitos Autorais (Lei nº 9.610/1998)",
                  "Estatuto da Advocacia (Lei nº 8.906/1994)",
                  "CPC (Lei nº 13.105/2015)",
                  "RGPD (para usuários da UE)"
                ].map((law, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <span className="text-gray-600 dark:text-gray-400">{law}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contato */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-600" />
              Contato e Suporte
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg">
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Para dúvidas, suporte ou esclarecimentos:
              </p>
              <a 
                href="mailto:suporte@promptsjuridicos.com.br" 
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Mail className="h-4 w-4" />
                suporte@promptsjuridicos.com.br
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center py-8 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-500">
            Prompts Jurídicos Ampliados - Termos de Uso v1.0 - Junho 2025
          </p>
        </div>
      </div>
    </div>
  );
}