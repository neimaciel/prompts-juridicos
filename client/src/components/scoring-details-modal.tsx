import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  CheckCircle, 
  Scale, 
  FileText, 
  Target, 
  Share2, 
  Copy,
  Trophy,
  AlertTriangle,
  XCircle
} from "lucide-react";

interface ScoringDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ScoringDetailsModal({ isOpen, onClose }: ScoringDetailsModalProps) {
  const { toast } = useToast();
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    setIsSharing(true);
    const shareText = `🎯 Conheça o Prompts Jurídicos - Sistema avançado de geração de prompts jurídicos com IA

✅ Análise rigorosa com 4 critérios principais
✅ Pontuação detalhada e feedback específico
✅ Conformidade com legislação brasileira
✅ Aplicabilidade prática garantida

Acesse: https://promptsjuridicos.com.br

#PromptJuridico #IA #Direito #Tecnologia`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Prompts Jurídicos - Sistema de IA para Direito',
          text: shareText,
          url: 'https://promptsjuridicos.com.br'
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        toast({
          title: "Texto copiado!",
          description: "Compartilhe com seus colegas através do WhatsApp, email ou redes sociais.",
          duration: 3000
        });
      }
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
      toast({
        title: "Erro ao compartilhar",
        description: "Tente novamente ou copie o link manualmente.",
        variant: "destructive"
      });
    } finally {
      setIsSharing(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText('https://promptsjuridicos.com.br');
      toast({
        title: "Link copiado!",
        description: "Link do Prompts Jurídicos copiado para a área de transferência.",
        duration: 3000
      });
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const criteria = [
    {
      icon: <Scale className="h-5 w-5" />,
      title: "Completude Legal",
      weight: "25%",
      description: "Verifica se o prompt contém todos os elementos jurídicos necessários",
      details: [
        "Presença de fundamentos legais adequados",
        "Informações suficientes para orientar o usuário",
        "Cobertura completa do tema solicitado",
        "Elementos processuais quando aplicável"
      ]
    },
    {
      icon: <FileText className="h-5 w-5" />,
      title: "Conformidade Legislativa",
      weight: "25%",
      description: "Checa se as referências legais estão corretas e atualizadas",
      details: [
        "Compatibilidade com legislação brasileira vigente",
        "Citações corretas de leis e códigos",
        "Jurisprudência relevante e atualizada",
        "Conformidade com regulamentações específicas"
      ]
    },
    {
      icon: <Target className="h-5 w-5" />,
      title: "Aplicabilidade Prática",
      weight: "25%",
      description: "Avalia se o prompt é utilizável na prática jurídica",
      details: [
        "Clareza e objetividade das orientações",
        "Direcionamentos concretos e aplicáveis",
        "Utilidade para profissionais do direito",
        "Adequação ao contexto prático"
      ]
    },
    {
      icon: <CheckCircle className="h-5 w-5" />,
      title: "Estrutura Jurídica",
      weight: "25%",
      description: "Verifica organização e formato adequado",
      details: [
        "Organização lógica das informações",
        "Linguagem jurídica apropriada",
        "Sequência estrutural correta",
        "Formatação profissional"
      ]
    }
  ];

  const scoreRanges = [
    {
      range: "95-100%",
      label: "Excepcional",
      color: "bg-green-100 text-green-800 border-green-200",
      icon: <Trophy className="h-4 w-4" />,
      description: "Qualidade superior com todos os critérios atendidos perfeitamente"
    },
    {
      range: "85-94%",
      label: "Excelente",
      color: "bg-blue-100 text-blue-800 border-blue-200",
      icon: <CheckCircle className="h-4 w-4" />,
      description: "Qualidade muito alta com pequenos ajustes necessários"
    },
    {
      range: "70-84%",
      label: "Boa",
      color: "bg-cyan-100 text-cyan-800 border-cyan-200",
      icon: <Target className="h-4 w-4" />,
      description: "Qualidade adequada com melhorias pontuais"
    },
    {
      range: "55-69%",
      label: "Regular",
      color: "bg-yellow-100 text-yellow-800 border-yellow-200",
      icon: <AlertTriangle className="h-4 w-4" />,
      description: "Atende ao básico mas precisa de aprimoramentos"
    },
    {
      range: "40-54%",
      label: "Inadequada",
      color: "bg-orange-100 text-orange-800 border-orange-200",
      icon: <AlertTriangle className="h-4 w-4" />,
      description: "Deficiências significativas que impedem uso adequado"
    },
    {
      range: "0-39%",
      label: "Insuficiente",
      color: "bg-red-100 text-red-800 border-red-200",
      icon: <XCircle className="h-4 w-4" />,
      description: "Não atende aos padrões mínimos de qualidade jurídica"
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-none max-h-none p-0 overflow-hidden sm:max-w-4xl sm:max-h-[90vh]" aria-describedby="scoring-details-description">
        <DialogHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-2xl">
            <Search className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            Sistema de Análise Rigorosa
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(95vh-100px)] sm:max-h-[calc(90vh-120px)] px-4 sm:px-6">
          <div className="space-y-4 sm:space-y-6 pb-4 sm:pb-6">
            {/* Hidden description for accessibility */}
            <div id="scoring-details-description" className="sr-only">
              Sistema de análise rigorosa com 4 critérios principais para avaliação de prompts jurídicos, incluindo escala de pontuação detalhada e funcionalidade de compartilhamento.
            </div>
            
            {/* Introdução */}
            <div className="bg-gradient-to-r from-primary/5 to-secondary/5 p-3 sm:p-4 rounded-lg border">
              <h3 className="font-semibold text-base sm:text-lg mb-2">Análise Mais Detalhada</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  Penalizações específicas para cada deficiência identificada
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  Avaliação granular dos 4 critérios principais
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  Feedback mais preciso sobre pontos de melhoria
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  Orientações específicas para aprimoramento
                </li>
              </ul>
            </div>

            {/* Critérios de Avaliação */}
            <div>
              <h3 className="font-semibold text-base sm:text-lg mb-3 sm:mb-4">Critérios de Avaliação</h3>
              <div className="grid gap-3 sm:gap-4">
                {criteria.map((criterion, index) => (
                  <div key={index} className="border rounded-lg p-3 sm:p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className="text-primary mt-1">
                        {criterion.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium text-sm sm:text-base">{criterion.title}</h4>
                          <Badge variant="secondary" className="text-xs">
                            {criterion.weight}
                          </Badge>
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3">
                          {criterion.description}
                        </p>
                        <ul className="text-xs space-y-1">
                          {criterion.details.map((detail, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <div className="w-1 h-1 bg-muted-foreground rounded-full mt-2 flex-shrink-0" />
                              <span className="text-muted-foreground">{detail}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Escala de Pontuação */}
            <div>
              <h3 className="font-semibold text-base sm:text-lg mb-3 sm:mb-4">Escala de Pontuação Rigorosa</h3>
              <div className="space-y-2 sm:space-y-3">
                {scoreRanges.map((range, index) => (
                  <div key={index} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-2 sm:p-3 rounded-lg border">
                    <div className="flex items-center gap-2">
                      <div className="text-muted-foreground">
                        {range.icon}
                      </div>
                      <div className="font-mono text-xs sm:text-sm font-medium min-w-[60px] sm:min-w-[80px]">
                        {range.range}
                      </div>
                      <Badge className={`${range.color} border text-xs`}>
                        {range.label}
                      </Badge>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground flex-1">
                      {range.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Compartilhamento */}
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 p-3 sm:p-4 rounded-lg border">
              <h3 className="font-semibold text-base sm:text-lg mb-2 sm:mb-3 flex items-center gap-2">
                <Share2 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                Compartilhe com Colegas
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                Conhece algum colega que precisa de uma ferramenta de IA para criar prompts jurídicos? 
                Compartilhe o Prompts Jurídicos e ajude outros profissionais do direito!
              </p>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Button 
                  onClick={handleShare}
                  disabled={isSharing}
                  className="flex-1 text-sm"
                  size="sm"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  {isSharing ? "Compartilhando..." : "Compartilhar"}
                </Button>
                <Button 
                  variant="outline"
                  onClick={copyLink}
                  className="flex-1 text-sm"
                  size="sm"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar Link
                </Button>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}