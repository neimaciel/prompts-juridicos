import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Upload, 
  FileText, 
  Shield, 
  Brain, 
  AlertTriangle, 
  CheckCircle, 
  Download,
  ArrowLeft,
  Lock,
  Zap,
  BarChart3
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AnalysisResult {
  id: string;
  filename: string;
  scores: {
    completeness: number;
    compliance: number;
    protection: number;
    clarity: number;
    overall: number;
  };
  risks: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
  }>;
  recommendations: string[];
  sensitiveDataDetected: boolean;
  tokensUsed: number;
}

type UploadStep = 'upload' | 'analyzing' | 'security' | 'results';

export default function ContractAnalysis() {
  const [currentStep, setCurrentStep] = useState<UploadStep>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [securityChoice, setSecurityChoice] = useState<'encrypt' | 'fictional' | 'reupload' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (file: File) => {
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Tipo de arquivo não suportado",
        description: "Por favor, envie arquivos PDF, DOC ou DOCX.",
        variant: "destructive"
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: "Arquivo muito grande",
        description: "O arquivo deve ter no máximo 10MB.",
        variant: "destructive"
      });
      return;
    }

    setSelectedFile(file);
    setTimeout(() => {
      setCurrentStep('analyzing');
      performRealAnalysis();
    }, 500);
  };

  const performRealAnalysis = async () => {
    try {
      if (!selectedFile) return;

      // Read file content
      const fileText = await readFileContent(selectedFile);
      
      // Start progress simulation while analysis happens
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += Math.random() * 10;
        if (progress <= 90) {
          setAnalysisProgress(progress);
        }
      }, 500);

      // Make API call to analyze contract
      const response = await fetch('/api/contracts/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileContent: fileText,
          filename: selectedFile.name
        })
      });

      clearInterval(progressInterval);
      setAnalysisProgress(100);

      if (!response.ok) {
        throw new Error(`Erro na análise: ${response.status}`);
      }

      const result = await response.json();

      if (result.requiresSecurity) {
        // Sensitive data detected, show security step
        setTimeout(() => setCurrentStep('security'), 500);
      } else if (result.success) {
        // Analysis complete, show results
        setAnalysisResult(result.analysis);
        setTimeout(() => setCurrentStep('results'), 1000);
      } else {
        throw new Error(result.error || 'Erro desconhecido na análise');
      }

    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Erro na análise",
        description: error instanceof Error ? error.message : "Erro interno do servidor",
        variant: "destructive"
      });
      
      // Reset to upload step on error
      setCurrentStep('upload');
      setSelectedFile(null);
      setAnalysisProgress(0);
    }
  };

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const content = e.target?.result as string;
        if (file.type === 'application/pdf') {
          // For PDF files, we'd normally use pdf-parse, but for now return placeholder
          resolve(content || 'PDF content would be extracted here');
        } else {
          resolve(content || '');
        }
      };
      
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      
      if (file.type.includes('pdf')) {
        reader.readAsArrayBuffer(file);
      } else {
        reader.readAsText(file);
      }
    });
  };

  const handleSecurityChoice = async (choice: 'encrypt' | 'fictional' | 'reupload') => {
    setSecurityChoice(choice);
    
    if (choice === 'reupload') {
      setCurrentStep('upload');
      setSelectedFile(null);
      setAnalysisProgress(0);
      setSecurityChoice(null);
      return;
    }

    // Proceed with real analysis using security choice
    try {
      if (!selectedFile) return;

      const fileText = await readFileContent(selectedFile);
      
      // Start progress simulation
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress <= 90) {
          setAnalysisProgress(progress);
        }
      }, 300);

      // Make API call with security choice
      const response = await fetch('/api/contracts/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileContent: fileText,
          filename: selectedFile.name,
          securityChoice: choice
        })
      });

      clearInterval(progressInterval);
      setAnalysisProgress(100);

      if (!response.ok) {
        throw new Error(`Erro na análise: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setAnalysisResult(result.analysis);
        setTimeout(() => setCurrentStep('results'), 1000);
      } else {
        throw new Error(result.error || 'Erro na análise');
      }

    } catch (error) {
      console.error('Security analysis error:', error);
      toast({
        title: "Erro na análise",
        description: error instanceof Error ? error.message : "Erro interno do servidor",
        variant: "destructive"
      });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => window.location.href = '/'}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Análise de Contratos</h1>
              <p className="text-gray-600">Análise inteligente com IA avançada</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            {/* Upload Step */}
            {currentStep === 'upload' && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card>
                  <CardHeader className="text-center">
                    <CardTitle className="flex items-center justify-center gap-2">
                      <FileText className="h-6 w-6" />
                      Upload de Contrato
                    </CardTitle>
                    <CardDescription>
                      Envie seu contrato para análise detalhada com IA
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div
                      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                        isDragging 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-medium mb-2">
                        Arraste seu contrato aqui ou clique para selecionar
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Suportamos arquivos PDF, DOC e DOCX até 10MB
                      </p>
                      <Button onClick={() => fileInputRef.current?.click()}>
                        Selecionar Arquivo
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileSelect(file);
                        }}
                      />
                    </div>

                    {/* Features */}
                    <div className="grid md:grid-cols-3 gap-6 mt-8">
                      <div className="text-center">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Brain className="h-6 w-6 text-blue-600" />
                        </div>
                        <h4 className="font-medium mb-2">IA Múltipla</h4>
                        <p className="text-sm text-gray-600">
                          Claude, OpenAI e Gemini para análise completa
                        </p>
                      </div>
                      <div className="text-center">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Shield className="h-6 w-6 text-green-600" />
                        </div>
                        <h4 className="font-medium mb-2">Segurança Total</h4>
                        <p className="text-sm text-gray-600">
                          Criptografia AES-256-GCM e conformidade LGPD
                        </p>
                      </div>
                      <div className="text-center">
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <BarChart3 className="h-6 w-6 text-purple-600" />
                        </div>
                        <h4 className="font-medium mb-2">Relatórios</h4>
                        <p className="text-sm text-gray-600">
                          Análise detalhada com riscos e recomendações
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Analyzing Step */}
            {currentStep === 'analyzing' && (
              <motion.div
                key="analyzing"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card>
                  <CardHeader className="text-center">
                    <CardTitle className="flex items-center justify-center gap-2">
                      <Brain className="h-6 w-6 animate-pulse" />
                      Analisando Contrato
                    </CardTitle>
                    <CardDescription>
                      Nossa IA está processando seu documento...
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center mb-6">
                        <p className="text-sm text-gray-600 mb-2">
                          Arquivo: {selectedFile?.name}
                        </p>
                        <Progress value={analysisProgress} className="w-full" />
                        <p className="text-sm text-gray-500 mt-2">
                          {Math.round(analysisProgress)}% concluído
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">Documento carregado</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">Texto extraído</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                          <span className="text-sm">Detectando dados sensíveis...</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Security Step */}
            {currentStep === 'security' && (
              <motion.div
                key="security"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card>
                  <CardHeader className="text-center">
                    <CardTitle className="flex items-center justify-center gap-2 text-orange-600">
                      <AlertTriangle className="h-6 w-6" />
                      Dados Sensíveis Detectados
                    </CardTitle>
                    <CardDescription>
                      Encontramos informações pessoais que precisam de proteção especial
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                        <h4 className="font-medium text-orange-800 mb-2">
                          Dados detectados:
                        </h4>
                        <ul className="text-sm text-orange-700 space-y-1">
                          <li>• CPF: 123.456.789-00</li>
                          <li>• Endereço: Rua das Flores, 123</li>
                          <li>• Telefone: (11) 99999-9999</li>
                        </ul>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-medium">Como deseja proceder?</h4>
                        
                        <div className="space-y-3">
                          <Button
                            variant={securityChoice === 'encrypt' ? 'default' : 'outline'}
                            className="w-full justify-start h-auto p-4"
                            onClick={() => handleSecurityChoice('encrypt')}
                          >
                            <div className="flex items-start gap-3">
                              <Lock className="h-5 w-5 mt-0.5" />
                              <div className="text-left">
                                <div className="font-medium">Criptografar dados (50 tokens)</div>
                                <div className="text-sm text-gray-600">
                                  Protege os dados com AES-256-GCM durante a análise
                                </div>
                              </div>
                            </div>
                          </Button>

                          <Button
                            variant={securityChoice === 'fictional' ? 'default' : 'outline'}
                            className="w-full justify-start h-auto p-4"
                            onClick={() => handleSecurityChoice('fictional')}
                          >
                            <div className="flex items-start gap-3">
                              <Zap className="h-5 w-5 mt-0.5" />
                              <div className="text-left">
                                <div className="font-medium">Substituir por dados fictícios (100 tokens)</div>
                                <div className="text-sm text-gray-600">
                                  Substitui dados reais por fictícios para análise
                                </div>
                              </div>
                            </div>
                          </Button>

                          <Button
                            variant={securityChoice === 'reupload' ? 'default' : 'outline'}
                            className="w-full justify-start h-auto p-4"
                            onClick={() => handleSecurityChoice('reupload')}
                          >
                            <div className="flex items-start gap-3">
                              <Upload className="h-5 w-5 mt-0.5" />
                              <div className="text-left">
                                <div className="font-medium">Enviar novo arquivo</div>
                                <div className="text-sm text-gray-600">
                                  Remova os dados sensíveis e envie novamente
                                </div>
                              </div>
                            </div>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Results Step */}
            {currentStep === 'results' && analysisResult && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Analysis Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Análise Concluída</span>
                      <Badge variant="outline">{analysisResult.tokensUsed} tokens usados</Badge>
                    </CardTitle>
                    <CardDescription>
                      Resultado da análise para {analysisResult.filename}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${getScoreColor(analysisResult.scores.completeness)}`}>
                          {analysisResult.scores.completeness}%
                        </div>
                        <div className="text-sm text-gray-600">Completude</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${getScoreColor(analysisResult.scores.compliance)}`}>
                          {analysisResult.scores.compliance}%
                        </div>
                        <div className="text-sm text-gray-600">Conformidade</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${getScoreColor(analysisResult.scores.protection)}`}>
                          {analysisResult.scores.protection}%
                        </div>
                        <div className="text-sm text-gray-600">Proteção</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${getScoreColor(analysisResult.scores.clarity)}`}>
                          {analysisResult.scores.clarity}%
                        </div>
                        <div className="text-sm text-gray-600">Clareza</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-3xl font-bold ${getScoreColor(analysisResult.scores.overall)}`}>
                          {analysisResult.scores.overall}%
                        </div>
                        <div className="text-sm text-gray-600">Geral</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Risks */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-orange-500" />
                      Riscos Identificados
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analysisResult.risks.map((risk, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                          <Badge className={getSeverityColor(risk.severity)}>
                            {risk.severity === 'high' ? 'Alto' : risk.severity === 'medium' ? 'Médio' : 'Baixo'}
                          </Badge>
                          <div>
                            <div className="font-medium">{risk.type}</div>
                            <div className="text-sm text-gray-600">{risk.description}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Recommendations */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      Recomendações
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {analysisResult.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Baixar Relatório
                  </Button>
                  <Button variant="outline" onClick={() => {
                    setCurrentStep('upload');
                    setSelectedFile(null);
                    setAnalysisProgress(0);
                    setAnalysisResult(null);
                    setSecurityChoice(null);
                  }}>
                    Nova Análise
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}