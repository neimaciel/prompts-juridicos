import { pgTable, text, serial, timestamp, json, varchar, boolean, real, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const legalPrompts = pgTable("legal_prompts", {
  id: serial("id").primaryKey(),
  userRequest: text("user_request").notNull(),
  legalPrompt: text("legal_prompt").notNull(),
  documentType: text("document_type").notNull(),
  areaTags: json("area_tags").$type<string[]>().notNull().default([]),
  region: varchar("region", { length: 100 }),
  city: varchar("city", { length: 100 }),
  aiModel: varchar("ai_model", { length: 50 }),
  relevanceScore: real("relevance_score").default(0), // 0-1 score for AI relevance
  relevanceReasoning: text("relevance_reasoning"), // AI's detailed analysis
  relevanceSuggestions: json("relevance_suggestions").$type<string[]>(), // AI's specific suggestions
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const adminSettings = pgTable("admin_settings", {
  id: serial("id").primaryKey(),
  activeAiModel: varchar("active_ai_model", { length: 50 }).notNull().default("claude"),
  openaiEnabled: boolean("openai_enabled").notNull().default(false),
  claudeEnabled: boolean("claude_enabled").notNull().default(true),
  geminiEnabled: boolean("gemini_enabled").notNull().default(false),
  supabaseEnabled: boolean("supabase_enabled").notNull().default(false),
  // Prompt limits
  maxPromptsPerPeriod: integer("max_prompts_per_period").notNull().default(1000),
  promptPeriodHours: integer("prompt_period_hours").notNull().default(24),
  maxPromptsPerUser: integer("max_prompts_per_user").notNull().default(10),
  userRateLimitMinutes: integer("user_rate_limit_minutes").notNull().default(10),
  // API Keys and credentials
  openaiApiKey: text("openai_api_key"),
  claudeApiKey: text("claude_api_key"),
  geminiApiKey: text("gemini_api_key"),
  supabaseUrl: text("supabase_url"),
  openaiAssistantId: text("openai_assistant_id"),
  // Score equalization settings
  scoreTemperature: real("score_temperature").notNull().default(0.7),
  analysisTemperature: real("analysis_temperature").notNull().default(0.7),
  geminiPromptModel: varchar("gemini_prompt_model", { length: 50 }).notNull().default("gemini-2.0-flash-lite"),
  geminiScoreModel: varchar("gemini_score_model", { length: 50 }).notNull().default("gemini-2.0-flash-lite"),
  
  // Advanced analysis criteria weights (0.0 to 1.0)
  legalCompletenessWeight: real("legal_completeness_weight").notNull().default(0.25),
  legislationComplianceWeight: real("legislation_compliance_weight").notNull().default(0.25),
  practicalApplicabilityWeight: real("practical_applicability_weight").notNull().default(0.25),
  legalStructureWeight: real("legal_structure_weight").notNull().default(0.25),
  
  // Granular criteria controls
  // Legal Completeness subcriteria
  doctrinalFoundationWeight: real("doctrinal_foundation_weight").notNull().default(0.3),
  jurisprudentialBasisWeight: real("jurisprudential_basis_weight").notNull().default(0.3),
  legalArgumentDepthWeight: real("legal_argument_depth_weight").notNull().default(0.4),
  
  // Legislation Compliance subcriteria  
  currentLegislationWeight: real("current_legislation_weight").notNull().default(0.4),
  specificArticlesWeight: real("specific_articles_weight").notNull().default(0.3),
  regulatoryUpdatesWeight: real("regulatory_updates_weight").notNull().default(0.3),
  
  // Practical Applicability subcriteria
  implementationGuidanceWeight: real("implementation_guidance_weight").notNull().default(0.4),
  proceduraStepsWeight: real("procedural_steps_weight").notNull().default(0.3),
  timeFrameSpecificationWeight: real("time_frame_specification_weight").notNull().default(0.3),
  
  // Legal Structure subcriteria
  formalLanguageWeight: real("formal_language_weight").notNull().default(0.3),
  logicalOrganizationWeight: real("logical_organization_weight").notNull().default(0.4),
  technicalPrecisionWeight: real("technical_precision_weight").notNull().default(0.3),
  
  // Scoring thresholds (0.0 to 1.0)
  excellentThreshold: real("excellent_threshold").notNull().default(0.90),
  goodThreshold: real("good_threshold").notNull().default(0.80),
  adequateThreshold: real("adequate_threshold").notNull().default(0.70),
  inferiorThreshold: real("inferior_threshold").notNull().default(0.60),
  
  // Analysis strictness controls
  requiresLegalReferences: boolean("requires_legal_references").notNull().default(true),
  requiresPracticalGuidance: boolean("requires_practical_guidance").notNull().default(true),
  requiresSpecificLegislation: boolean("requires_specific_legislation").notNull().default(true),
  
  // Content restrictions
  restrictToLegalTopics: boolean("restrict_to_legal_topics").notNull().default(false),
  
  favoriteConfig: json("favorite_config").$type<{
    name: string, 
    temperature: number, 
    analysisTemperature: number, 
    promptModel: string, 
    scoreModel: string,
    weights: {
      legalCompleteness: number,
      legislationCompliance: number,
      practicalApplicability: number,
      legalStructure: number
    },
    thresholds: {
      excellent: number,
      good: number,
      adequate: number,
      inferior: number
    },
    requirements: {
      legalReferences: boolean,
      practicalGuidance: boolean,
      specificLegislation: boolean
    }
  }>(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const promptUsage = pgTable("prompt_usage", {
  id: serial("id").primaryKey(),
  userIp: varchar("user_ip", { length: 45 }).notNull(), // IPv4 or IPv6
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Configuration presets table
export const configurationPresets = pgTable("configuration_presets", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(false),
  
  // Temperature settings
  scoreTemperature: real("score_temperature").notNull().default(0.7),
  analysisTemperature: real("analysis_temperature").notNull().default(0.7),
  geminiPromptModel: varchar("gemini_prompt_model", { length: 50 }).notNull().default("gemini-2.0-flash-lite"),
  geminiScoreModel: varchar("gemini_score_model", { length: 50 }).notNull().default("gemini-2.0-flash-lite"),
  
  // Main criteria weights
  legalCompletenessWeight: real("legal_completeness_weight").notNull().default(0.25),
  legislationComplianceWeight: real("legislation_compliance_weight").notNull().default(0.25),
  practicalApplicabilityWeight: real("practical_applicability_weight").notNull().default(0.25),
  legalStructureWeight: real("legal_structure_weight").notNull().default(0.25),
  
  // Granular subcriteria weights
  doctrinalFoundationWeight: real("doctrinal_foundation_weight").notNull().default(0.3),
  jurisprudentialBasisWeight: real("jurisprudential_basis_weight").notNull().default(0.3),
  legalArgumentDepthWeight: real("legal_argument_depth_weight").notNull().default(0.4),
  currentLegislationWeight: real("current_legislation_weight").notNull().default(0.4),
  specificArticlesWeight: real("specific_articles_weight").notNull().default(0.3),
  regulatoryUpdatesWeight: real("regulatory_updates_weight").notNull().default(0.3),
  implementationGuidanceWeight: real("implementation_guidance_weight").notNull().default(0.4),
  proceduralStepsWeight: real("procedural_steps_weight").notNull().default(0.3),
  timeFrameSpecificationWeight: real("time_frame_specification_weight").notNull().default(0.3),
  formalLanguageWeight: real("formal_language_weight").notNull().default(0.3),
  logicalOrganizationWeight: real("logical_organization_weight").notNull().default(0.4),
  technicalPrecisionWeight: real("technical_precision_weight").notNull().default(0.3),
  
  // Scoring thresholds
  excellentThreshold: real("excellent_threshold").notNull().default(0.90),
  goodThreshold: real("good_threshold").notNull().default(0.80),
  adequateThreshold: real("adequate_threshold").notNull().default(0.70),
  inferiorThreshold: real("inferior_threshold").notNull().default(0.60),
  
  // Requirements
  requiresLegalReferences: boolean("requires_legal_references").notNull().default(true),
  requiresPracticalGuidance: boolean("requires_practical_guidance").notNull().default(true),
  requiresSpecificLegislation: boolean("requires_specific_legislation").notNull().default(true),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Histórico de iterações de prompts
export const promptIterations = pgTable("prompt_iterations", {
  id: serial("id").primaryKey(),
  originalPromptId: integer("original_prompt_id").references(() => legalPrompts.id),
  iterationNumber: integer("iteration_number").notNull(),
  userRequest: text("user_request").notNull(),
  improvementSuggestions: json("improvement_suggestions"),
  selectedImprovements: json("selected_improvements"),
  customAdditions: text("custom_additions"),
  legalPrompt: text("legal_prompt").notNull(),
  documentType: text("document_type").notNull(),
  areaTags: json("area_tags").notNull().$type<string[]>(),
  relevanceScore: real("relevance_score"),
  relevanceReasoning: text("relevance_reasoning"),
  relevanceSuggestions: json("relevance_suggestions").$type<string[]>(),
  aiModel: text("ai_model").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Cache de sugestões para evitar recálculos
export const improvementSuggestionsCache = pgTable("improvement_suggestions_cache", {
  id: serial("id").primaryKey(),
  promptId: integer("prompt_id").references(() => legalPrompts.id),
  suggestionType: text("suggestion_type").notNull(), // 'system' ou 'ai'
  suggestions: json("suggestions").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Tabela para rastrear visitas dos usuários
export const userVisits = pgTable("user_visits", {
  id: serial("id").primaryKey(),
  userIdentifier: text("user_identifier").notNull(), // sessionId ou IP como identificador
  visitCount: integer("visit_count").notNull().default(1),
  lastVisit: timestamp("last_visit").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Tabela para armazenar avaliações dos usuários
export const userRatings = pgTable("user_ratings", {
  id: serial("id").primaryKey(),
  userIdentifier: text("user_identifier").notNull(),
  rating: varchar("rating", { length: 10 }).notNull(), // 'very_bad', 'bad', 'neutral', 'good', 'very_good'
  visitNumber: integer("visit_number").notNull(), // 2 ou 10
  feedback: text("feedback"), // comentário opcional
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertLegalPromptSchema = createInsertSchema(legalPrompts).omit({
  id: true,
  createdAt: true,
});

export const insertAdminSettingsSchema = createInsertSchema(adminSettings).omit({
  id: true,
  updatedAt: true,
});

export const insertUserVisitSchema = createInsertSchema(userVisits).omit({
  id: true,
  createdAt: true,
  lastVisit: true,
});

export const insertUserRatingSchema = createInsertSchema(userRatings).omit({
  id: true,
  createdAt: true,
});

export const insertConfigurationPresetSchema = createInsertSchema(configurationPresets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Sistema de Usuários Principal
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  passwordHash: text("password_hash"),
  name: varchar("name", { length: 200 }),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  googleId: varchar("google_id", { length: 100 }).unique(),
  profileImageUrl: text("profile_image_url"),
  tokenBalance: integer("token_balance").default(1700),
  currentPlan: varchar("current_plan", { length: 50 }).default("free"),
  emailVerified: boolean("email_verified").default(false),
  stripeCustomerId: varchar("stripe_customer_id", { length: 100 }),
  subscriptionPlan: varchar("subscription_plan", { length: 50 }).default("free"),
  subscriptionStatus: varchar("subscription_status", { length: 50 }).default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Sistema de Tokens Principal
export const userTokens = pgTable("user_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  currentBalance: integer("current_balance").default(1700), // Free plan: 1700 tokens
  totalPurchased: integer("total_purchased").default(0),
  totalConsumed: integer("total_consumed").default(0),
  planTokens: integer("plan_tokens").default(1700),
  billingPeriodStart: timestamp("billing_period_start").defaultNow(),
  billingPeriodEnd: timestamp("billing_period_end"),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Documentos Gerados
export const generatedDocuments = pgTable("generated_documents", {
  id: serial("id").primaryKey(),
  promptId: integer("prompt_id").references(() => legalPrompts.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  format: varchar("format", { length: 10 }).$type<'doc' | 'pdf' | 'txt'>().notNull(),
  content: text("content").notNull(),
  tokensConsumed: integer("tokens_consumed").default(5),
  generatedAt: timestamp("generated_at").defaultNow(),
  downloadCount: integer("download_count").default(0)
});

// Transações de Tokens
export const tokenTransactionsMain = pgTable("token_transactions_main", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  type: varchar("type", { length: 20 }).$type<'consumption' | 'purchase' | 'bonus'>().notNull(),
  amount: integer("amount").notNull(), // Negativo para consumo
  operation: varchar("operation", { length: 50 }), // 'document_generation', 'plan_upgrade'
  documentId: integer("document_id").references(() => generatedDocuments.id),
  description: text("description"),
  balanceAfter: integer("balance_after"),
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow()
});

// Insert schemas para as novas tabelas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserTokensSchema = createInsertSchema(userTokens).omit({
  id: true,
  updatedAt: true,
});

export const insertGeneratedDocumentSchema = createInsertSchema(generatedDocuments).omit({
  id: true,
  generatedAt: true,
});

export const insertTokenTransactionSchema = createInsertSchema(tokenTransactionsMain).omit({
  id: true,
  createdAt: true,
});

// Tipos para as novas tabelas
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type UserTokens = typeof userTokens.$inferSelect;
export type InsertUserTokens = z.infer<typeof insertUserTokensSchema>;

export type GeneratedDocument = typeof generatedDocuments.$inferSelect;
export type InsertGeneratedDocument = z.infer<typeof insertGeneratedDocumentSchema>;

export type TokenTransactionMain = typeof tokenTransactionsMain.$inferSelect;
export type InsertTokenTransaction = z.infer<typeof insertTokenTransactionSchema>;

// Constantes para planos e custos
export const TOKEN_PLANS = {
  free: { name: 'Gratuito', tokens: 10, price: 0 },
  professional: { name: 'Profissional', tokens: 100, price: 29.90 },
  office: { name: 'Escritório', tokens: 500, price: 99.90 }
} as const;

export const TOKEN_COSTS = {
  document_generation: 5,
  prompt_regeneration: 1,
  quality_analysis: 2
} as const;

export type InsertLegalPrompt = z.infer<typeof insertLegalPromptSchema>;
export type LegalPrompt = typeof legalPrompts.$inferSelect;
export type InsertAdminSettings = z.infer<typeof insertAdminSettingsSchema>;
export type AdminSettings = typeof adminSettings.$inferSelect;
export type InsertConfigurationPreset = z.infer<typeof insertConfigurationPresetSchema>;
export type ConfigurationPreset = typeof configurationPresets.$inferSelect;

// New schemas for quality improvement system
export const insertPromptIterationSchema = createInsertSchema(promptIterations).omit({
  id: true,
  createdAt: true,
});

export const insertImprovementSuggestionsCacheSchema = createInsertSchema(improvementSuggestionsCache).omit({
  id: true,
  createdAt: true,
});

export type InsertPromptIteration = z.infer<typeof insertPromptIterationSchema>;
export type PromptIteration = typeof promptIterations.$inferSelect;
export type InsertImprovementSuggestionsCache = z.infer<typeof insertImprovementSuggestionsCacheSchema>;
export type ImprovementSuggestionsCache = typeof improvementSuggestionsCache.$inferSelect;

// API request schema
export const generatePromptRequestSchema = z.object({
  userRequest: z.string().min(1, "A solicitação é obrigatória"),
  region: z.string().optional(),
  city: z.string().optional(),
});

export type GeneratePromptRequest = z.infer<typeof generatePromptRequestSchema>;

// AI response schema for advanced legal prompts
export const openAIResponseSchema = z.object({
  legalPrompt: z.string().min(1, "Prompt jurídico é obrigatório"),
  documentType: z.string().min(1, "Tipo de documento é obrigatório"),
  areaTags: z.array(z.string()),
  promptInstructions: z.string().optional(),
  suggestedUsage: z.string().optional(),
});

export type OpenAIResponse = z.infer<typeof openAIResponseSchema>;

// Quality Improvement System Types
export interface ImprovementSuggestion {
  id: string;
  type: 'system' | 'ai';
  category: 'legal_references' | 'structure' | 'compliance' | 'clarity' | 'practical';
  title: string;
  description: string;
  impact_score: number; // 1-10
  implementation_text: string;
  selected: boolean;
  custom_text?: string;
}

export interface QualityCriteria {
  terminology: { score: number; status: string; description: string };
  structure: { score: number; status: string; description: string };
  legal_compliance: { score: number; status: string; description: string };
  legal_protection: { score: number; status: string; description: string };
  practical_applicability: { score: number; status: string; description: string };
}

export interface DetailedQualityAnalysis {
  current_score: number;
  analysis_reasoning: string;
  ai_suggestions: ImprovementSuggestion[];
  quality_criteria: QualityCriteria;
  document_type: string;
  improvement_potential: number;
}

export interface RegenerationRequest {
  selected_improvements: string[];
  custom_additions: string;
  additional_requirements: string;
}

export const regenerationRequestSchema = z.object({
  selected_improvements: z.array(z.string()),
  custom_additions: z.string().optional().default(''),
  additional_requirements: z.string().optional().default(''),
});

export type RegenerationRequestType = z.infer<typeof regenerationRequestSchema>;

// Regiões do Paraná para insights de mercado
export const paranaRegions = [
  "Região Metropolitana de Curitiba",
  "Norte Central Paranaense", 
  "Norte Pioneiro Paranaense",
  "Noroeste Paranaense",
  "Centro Ocidental Paranaense",
  "Centro Oriental Paranaense",
  "Oeste Paranaense",
  "Sudoeste Paranaense",
  "Centro-Sul Paranaense",
  "Sudeste Paranaense"
] as const;

// User Feedback Surveys table
export const userFeedbackSurveys = pgTable("user_feedback_surveys", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"), // References users.id for authenticated users
  userIdentifier: varchar("user_identifier", { length: 255 }).notNull(), // For non-authenticated users (browser fingerprint + localStorage)
  satisfactionScore: integer("satisfaction_score"), // 0-10 rating, nullable
  usageFrequency: integer("usage_frequency"), // 0-10 rating, nullable  
  suggestions: text("suggestions"), // Open text feedback, nullable
  ipAddress: varchar("ip_address", { length: 45 }), // For analytics
  userAgent: text("user_agent"), // Browser info
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User Feedback Surveys schemas and types
export const insertUserFeedbackSurveySchema = createInsertSchema(userFeedbackSurveys).omit({
  id: true,
  createdAt: true,
});

export type UserFeedbackSurvey = typeof userFeedbackSurveys.$inferSelect;
export type InsertUserFeedbackSurvey = z.infer<typeof insertUserFeedbackSurveySchema>;

// Frontend feedback submission schema
export const feedbackSubmissionSchema = z.object({
  satisfactionScore: z.number().min(0).max(10).optional(),
  usageFrequency: z.number().min(0).max(10).optional(),
  suggestions: z.string().optional(),
  userIdentifier: z.string().optional(),
});

export type FeedbackSubmission = z.infer<typeof feedbackSubmissionSchema>;
