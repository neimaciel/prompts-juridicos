import React, { useState, useCallback } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  error?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  onAnalyze,
  isAnalyzing,
  error
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (isValidFile(file)) {
        setSelectedFile(file);
        onFileSelect(file);
      }
    }
  }, [onFileSelect]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (isValidFile(file)) {
        setSelectedFile(file);
        onFileSelect(file);
      }
    }
  }, [onFileSelect]);

  const isValidFile = (file: File) => {
    const validTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    return validTypes.includes(file.type) && file.size <= 10 * 1024 * 1024; // 10MB
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
          ${selectedFile ? 'border-green-500 bg-green-50' : ''}
          hover:border-blue-400 hover:bg-blue-50
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="file-upload"
          className="hidden"
          onChange={handleChange}
          accept=".pdf,.doc,.docx,.txt"
        />
        
        <label htmlFor="file-upload" className="cursor-pointer">
          <div className="flex flex-col items-center space-y-4">
            {selectedFile ? (
              <>
                <CheckCircle className="h-12 w-12 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-700">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
              </>
            ) : (
              <>
                <Upload className="h-12 w-12 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Clique para fazer upload ou arraste o arquivo aqui
                  </p>
                  <p className="text-xs text-gray-500">
                    PDF, DOC, DOCX ou TXT (máx. 10MB)
                  </p>
                </div>
              </>
            )}
          </div>
        </label>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <span className="text-sm text-red-700">{error}</span>
        </div>
      )}

      {selectedFile && !error && (
        <button
          onClick={onAnalyze}
          disabled={isAnalyzing}
          className={`
            mt-4 w-full py-3 px-4 rounded-md font-medium transition-colors
            ${isAnalyzing 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
            }
          `}
        >
          {isAnalyzing ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Analisando contrato...</span>
            </div>
          ) : (
            'Iniciar Análise'
          )}
        </button>
      )}
    </div>
  );
};

export default FileUpload;