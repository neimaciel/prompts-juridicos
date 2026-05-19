import { useState, useCallback } from 'react';
import { useLocation } from 'wouter';
import { FileUpload } from '../components/FileUpload';
import { api } from '../lib/api';
import { AlertTriangle, Shield, FileText, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';

interface AnalysisState {
  file: File | null;
  contractId: string | null;
  analysisResult: any | null;
  sensitiveData: any | null;
  isAnalyzing: boolean;
  error: string | null;
  step: 'upload' | 'sensitive-check' | 'analysis' | 'complete';
}

const AnalysisPage = () => {
  const [, navigate] = useLocation();
  const [state, setState] = useState<AnalysisState>({
    file: null,
    contractId: null,
    analysisResult: null,
    sensitiveData: null,
    isAnalyzing: false,
    error: null,
    step: 'upload'
  });

  const handleFileSelect = useCallback((file: File) => {
    setState(prev => ({
      ...prev,
      file,
      error: null
    }));
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!state.file) return;

    setState(prev => ({ ...prev, isAnalyzing: true, error: null }));

    try {
      // Upload file
      const uploadResponse = await api.uploadContract(state.file);
      if (!uploadResponse.ok) {
        throw new Error('Erro no upload do arquivo');
      }

      const uploadData = await uploadResponse.json();
      const contractId = uploadData.contractId;

      setState(prev => ({
        ...prev,
        contractId,
        step: uploadData.hasSensitiveData ? 'sensitive-check' : 'analysis',
        sensitiveData: uploadData.hasSensitiveData ? uploadData.sensitiveData : null
      }));

      // If no sensitive data, proceed with analysis
      if (!uploadData.hasSensitiveData) {
        await performAnalysis(contractId);
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        isAnalyzing: false
      }));
    }
  }, [state.file]);

  const performAnalysis = async (contractId: string) => {
    try {
      const analysisResponse = await api.analyzeContract(contractId);
      
      if (analysisResponse.error) {
        throw new Error(analysisResponse.error);
      }

      setState(prev => ({
        ...prev,
        analysisResult: analysisResponse.data,
        step: 'complete',
        isAnalyzing: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Erro na análise',
        isAnalyzing: false
      }));
    }
  };

  const handleSensitiveDataAction = async (action: 'encrypt' | 'fictional' | 'reupload') => {
    if (!state.contractId) return;

    setState(prev => ({ ...prev, isAnalyzing: true, error: null }));

    try {
      let response;
      
      switch (action) {
        case 'encrypt':
          response = await api.encryptSensitiveData(state.contractId);
          break;
        case 'fictional':
          response = await api.replaceFictionalData(state.contractId);
          break;
        case 'reupload':
          setState(prev => ({
            ...prev,
            file: null,
            contractId: null,
            step: 'upload',
            isAnalyzing: false,
            sensitiveData: null
          }));
          return;
      }

      if (response?.error) {
        throw new Error(response.error);
      }

      // Proceed with analysis after handling sensitive data
      await performAnalysis(state.contractId);
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Erro ao processar dados sensíveis',
        isAnalyzing: false
      }));
    }
  };

  const renderUploadStep = () => (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <FileText className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Análise de Contratos</h1>
          <p className="text-gray-600">Faça upload do seu contrato para análise completa com IA</p>
        </div>
        
        <FileUpload
          onFileSelect={handleFileSelect}
          onAnalyze={handleAnalyze}
          isAnalyzing={state.isAnalyzing}
          error={state.error}
        />
      </div>
    </div>
  );

  const renderSensitiveDataStep = () => (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <AlertTriangle className="h-16 w-16 text-yellow-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Dados Sensíveis Detectados</h2>
          <p className="text-gray-600">Encontramos informações sensíveis no seu documento</p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
          <h3 className="font-semibold text-yellow-800 mb-3">Tipos de dados detectados:</h3>
          <ul className="list-disc list-inside text-yellow-700 space-y-1">
            {state.sensitiveData?.types?.map((type: string, index: number) => (
              <li key={index}>{type}</li>
            ))}
          </ul>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <button
            onClick={() => handleSensitiveDataAction('encrypt')}
            disabled={state.isAnalyzing}
            className="p-6 border border-green-300 rounded-lg hover:bg-green-50 disabled:opacity-50"
          >
            <Shield className="h-8 w-8 text-green-600 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Criptografar</h3>
            <p className="text-sm text-gray-600">Proteger dados sensíveis com criptografia</p>
            <p className="text-xs text-green-600 font-medium mt-2">50 tokens</p>
          </button>

          <button
            onClick={() => handleSensitiveDataAction('fictional')}
            disabled={state.isAnalyzing}
            className="p-6 border border-blue-300 rounded-lg hover:bg-blue-50 disabled:opacity-50"
          >
            <FileText className="h-8 w-8 text-blue-600 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Dados Fictícios</h3>
            <p className="text-sm text-gray-600">Substituir por dados fictícios</p>
            <p className="text-xs text-blue-600 font-medium mt-2">75 tokens</p>
          </button>

          <button
            onClick={() => handleSensitiveDataAction('reupload')}
            disabled={state.isAnalyzing}
            className="p-6 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <ArrowLeft className="h-8 w-8 text-gray-600 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Refazer Upload</h3>
            <p className="text-sm text-gray-600">Enviar outro arquivo</p>
            <p className="text-xs text-gray-600 font-medium mt-2">Gratuito</p>
          </button>
        </div>
      </div>
    </div>
  );

  const renderAnalysisStep = () => (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Analisando Contrato</h2>
          <p className="text-gray-600">Nossa IA está examinando seu documento...</p>
        </div>
      </div>
    </div>
  );

  const renderCompleteStep = () => (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Análise Concluída</h2>
          <p className="text-gray-600">Sua análise está pronta</p>
        </div>

        {state.analysisResult && (
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-4">Pontuação de Risco</h3>
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-3xl font-bold text-blue-600">
                    {state.analysisResult.riskScore || 0}%
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    (state.analysisResult.riskScore || 0) > 70 ? 'bg-red-100 text-red-800' :
                    (state.analysisResult.riskScore || 0) > 40 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {(state.analysisResult.riskScore || 0) > 70 ? 'Alto Risco' :
                     (state.analysisResult.riskScore || 0) > 40 ? 'Médio Risco' : 'Baixo Risco'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${state.analysisResult.riskScore || 0}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-4">Resumo</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm">Análise completa realizada</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <span className="text-sm">Tokens utilizados: {state.analysisResult.tokensUsed || 0}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-center space-x-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Ver Dashboard
          </button>
          <button
            onClick={() => setState(prev => ({ ...prev, step: 'upload', file: null, contractId: null, analysisResult: null }))}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Nova Análise
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12">
      <div className="container mx-auto px-4">
        <button
          onClick={() => navigate('/dashboard')}
          className="mb-8 flex items-center space-x-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Voltar ao Dashboard</span>
        </button>

        {state.step === 'upload' && renderUploadStep()}
        {state.step === 'sensitive-check' && renderSensitiveDataStep()}
        {state.step === 'analysis' && renderAnalysisStep()}
        {state.step === 'complete' && renderCompleteStep()}
      </div>
    </div>
  );
};

export default AnalysisPage;