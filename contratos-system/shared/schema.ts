import { pgTable, serial, varchar, integer, text, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Contract Users
export const contractUsers = pgTable("contract_users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }).unique(),
  currentPlan: varchar("current_plan", { length: 50 }).default("free"),
  subscriptionStatus: varchar("subscription_status", { length: 50 }).default("active"),
  createdAt: timestamp("created_at").defaultNow()
});

// Token Balance
export const userTokenBalance = pgTable("user_token_balance", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => contractUsers.id).notNull(),
  currentBalance: integer("current_balance").default(0),
  totalPurchased: integer("total_purchased").default(0),
  totalConsumed: integer("total_consumed").default(0),
  planTokens: integer("plan_tokens").default(0),
  billingPeriodStart: timestamp("billing_period_start"),
  billingPeriodEnd: timestamp("billing_period_end"),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Contract Analyses
export const contractAnalyses = pgTable("contract_analyses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => contractUsers.id).notNull(),
  originalFilename: varchar("original_filename", { length: 255 }),
  fileHash: varchar("file_hash", { length: 64 }),
  fileSize: integer("file_size"),
  
  // Content
  contentType: varchar("content_type", { length: 20 }).default("plain"), // 'plain' | 'encrypted' | 'fictional'
  extractedText: text("extracted_text"),
  encryptedContent: text("encrypted_content"),
  encryptionIv: varchar("encryption_iv", { length: 32 }),
  encryptionTag: varchar("encryption_tag", { length: 32 }),
  
  // Scores
  overallScore: integer("overall_score"),
  completenessScore: integer("completeness_score"),
  complianceScore: integer("compliance_score"),
  protectionScore: integer("protection_score"),
  clarityScore: integer("clarity_score"),
  
  // Analysis data
  contractType: varchar("contract_type", { length: 100 }),
  sensitiveDataDetected: jsonb("sensitive_data_detected"),
  analysisResults: jsonb("analysis_results"),
  recommendations: jsonb("recommendations"),
  
  // Token usage
  tokensConsumed: integer("tokens_consumed"),
  operationBreakdown: jsonb("operation_breakdown"),
  
  // Metadata
  analysisDuration: integer("analysis_duration"),
  aiModelUsed: varchar("ai_model_used", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow()
});

// Token Transactions
export const tokenTransactions = pgTable("token_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => contractUsers.id).notNull(),
  transactionType: varchar("transaction_type", { length: 50 }), // 'purchase', 'consumption', 'refund'
  operation: varchar("operation", { length: 50 }), // 'encrypt', 'decrypt', 'analyze', 'fictional'
  tokensAmount: integer("tokens_amount"),
  contractAnalysisId: integer("contract_analysis_id").references(() => contractAnalyses.id),
  stripePaymentIntent: varchar("stripe_payment_intent", { length: 255 }),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow()
});

// Contract System Settings
export const contractSystemSettings = pgTable("contract_system_settings", {
  id: serial("id").primaryKey(),
  stripePublishableKey: varchar("stripe_publishable_key", { length: 255 }),
  stripeSecretKey: varchar("stripe_secret_key", { length: 255 }),
  stripeWebhookSecret: varchar("stripe_webhook_secret", { length: 255 }),
  systemEnabled: boolean("system_enabled").default(true),
  maxFileSize: integer("max_file_size").default(10485760), // 10MB
  allowedFileTypes: jsonb("allowed_file_types").default(["pdf", "doc", "docx"]),
  tokenPricing: jsonb("token_pricing"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Insert schemas
export const insertContractUserSchema = createInsertSchema(contractUsers).omit({
  id: true,
  createdAt: true
});

export const insertTokenBalanceSchema = createInsertSchema(userTokenBalance).omit({
  id: true,
  updatedAt: true
});

export const insertContractAnalysisSchema = createInsertSchema(contractAnalyses).omit({
  id: true,
  createdAt: true
});

export const insertTokenTransactionSchema = createInsertSchema(tokenTransactions).omit({
  id: true,
  createdAt: true
});

// Types
export type ContractUser = typeof contractUsers.$inferSelect;
export type InsertContractUser = z.infer<typeof insertContractUserSchema>;

export type UserTokenBalance = typeof userTokenBalance.$inferSelect;
export type InsertUserTokenBalance = z.infer<typeof insertTokenBalanceSchema>;

export type ContractAnalysis = typeof contractAnalyses.$inferSelect;
export type InsertContractAnalysis = z.infer<typeof insertContractAnalysisSchema>;

export type TokenTransaction = typeof tokenTransactions.$inferSelect;
export type InsertTokenTransaction = z.infer<typeof insertTokenTransactionSchema>;

export type ContractSystemSettings = typeof contractSystemSettings.$inferSelect;

// Token Plans
export interface TokenPlan {
  id: string;
  name: string;
  tokens: number;
  price: number;
  stripePriceId: string;
  features: string[];
  popular?: boolean;
}

export const SUBSCRIPTION_PLANS: TokenPlan[] = [
  {
    id: 'free',
    name: 'Gratuito',
    tokens: 500,
    price: 0,
    stripePriceId: '',
    features: [
      '500 tokens mensais',
      'Análise básica de contratos',
      'Relatório em PDF',
      'Suporte por email'
    ]
  },
  {
    id: 'professional',
    name: 'Profissional',
    tokens: 5000,
    price: 49.90,
    stripePriceId: 'price_professional_monthly',
    features: [
      '5.000 tokens mensais',
      'Análise avançada com criptografia',
      'Comparação de contratos',
      'Relatórios personalizados',
      'Suporte prioritário'
    ],
    popular: true
  },
  {
    id: 'enterprise',
    name: 'Escritório',
    tokens: 25000,
    price: 199.90,
    stripePriceId: 'price_enterprise_monthly',
    features: [
      '25.000 tokens mensais',
      'Análise ilimitada',
      'API de integração',
      'Dashboard multi-usuário',
      'Suporte 24/7'
    ]
  }
];

// Token costs
export const TOKEN_COSTS = {
  encrypt: 50,
  decrypt: 25,
  analyze_basic: 100,
  analyze_encrypted: 150,
  replace_fictional: 75,
  compare_contracts: 200
} as const;

// Sensitive data detection types
export interface SensitiveDataMatch {
  type: string;
  value: string;
  position: { start: number; end: number };
  confidence: number;
  suggestion: string;
}

export interface SecurityChoice {
  action: 'encrypt' | 'fictional' | 'reupload';
  data: SensitiveDataMatch[];
  userTokens: number;
}

// Analysis result interfaces
export interface AnalysisResult {
  id: number;
  overallScore: number;
  scores: {
    completeness: number;
    compliance: number;
    protection: number;
    clarity: number;
  };
  contractType: string;
  risks: Risk[];
  recommendations: Recommendation[];
  sensitiveDataHandled: boolean;
  tokensUsed: number;
  analysisTime: number;
}

export interface Risk {
  level: 'high' | 'medium' | 'low';
  category: string;
  description: string;
  clause?: string;
  suggestion: string;
}

export interface Recommendation {
  type: 'add' | 'modify' | 'remove';
  category: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  suggestedText?: string;
}