-- Script SQL para criar as tabelas no Supabase
-- Execute este código no painel SQL do Supabase

-- Criação da tabela legal_prompts
CREATE TABLE IF NOT EXISTS legal_prompts (
    id SERIAL PRIMARY KEY,
    user_request TEXT NOT NULL,
    legal_prompt TEXT NOT NULL,
    document_type TEXT NOT NULL,
    area_tags TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_legal_prompts_created_at ON legal_prompts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_legal_prompts_document_type ON legal_prompts(document_type);
CREATE INDEX IF NOT EXISTS idx_legal_prompts_area_tags ON legal_prompts USING GIN(area_tags);

-- RLS (Row Level Security) - opcional, pode habilitar se quiser controle de acesso
-- ALTER TABLE legal_prompts ENABLE ROW LEVEL SECURITY;

-- Comentários para documentação
COMMENT ON TABLE legal_prompts IS 'Tabela para armazenar prompts jurídicos gerados pela IA';
COMMENT ON COLUMN legal_prompts.user_request IS 'Solicitação original do usuário';
COMMENT ON COLUMN legal_prompts.legal_prompt IS 'Prompt jurídico gerado pela IA';
COMMENT ON COLUMN legal_prompts.document_type IS 'Tipo de documento jurídico';
COMMENT ON COLUMN legal_prompts.area_tags IS 'Tags das áreas jurídicas aplicáveis';
COMMENT ON COLUMN legal_prompts.created_at IS 'Data e hora de criação do registro';