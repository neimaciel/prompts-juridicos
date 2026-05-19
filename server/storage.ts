import { 
  legalPrompts, 
  adminSettings,
  promptUsage,
  configurationPresets,
  promptIterations,
  improvementSuggestionsCache,
  userVisits,
  userRatings,
  users,
  userTokens,
  generatedDocuments,
  tokenTransactionsMain,
  userFeedbackSurveys,
  type LegalPrompt, 
  type InsertLegalPrompt,
  type AdminSettings,
  type InsertAdminSettings,
  type ConfigurationPreset,
  type InsertConfigurationPreset,
  type PromptIteration,
  type InsertPromptIteration,
  type ImprovementSuggestionsCache,
  type InsertImprovementSuggestionsCache,
  type DetailedQualityAnalysis,
  type ImprovementSuggestion,
  type User,
  type InsertUser,
  type UserTokens,
  type InsertUserTokens,
  type GeneratedDocument,
  type InsertGeneratedDocument,
  type TokenTransactionMain,
  type InsertTokenTransaction,
  type UserFeedbackSurvey,
  type InsertUserFeedbackSurvey
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and } from "drizzle-orm";

export interface IStorage {
  // Legal Prompts
  createLegalPrompt(prompt: InsertLegalPrompt): Promise<LegalPrompt>;
  getAllLegalPrompts(): Promise<LegalPrompt[]>;
  getPaginatedLegalPrompts(offset: number, limit: number): Promise<{ prompts: LegalPrompt[]; total: number }>;
  getLegalPromptById(id: number): Promise<LegalPrompt | undefined>;
  
  // Admin Settings
  getAdminSettings(): Promise<AdminSettings>;
  updateAdminSettings(settings: Partial<InsertAdminSettings>): Promise<AdminSettings>;
  
  // Analytics
  getPromptsByRegion(): Promise<Array<{ region: string; count: number }>>;
  getPromptsByAiModel(): Promise<Array<{ aiModel: string; count: number }>>;
  getPromptsByMonth(): Promise<Array<{ month: string; count: number }>>;
  
  // Prompt Usage Tracking
  recordPromptUsage(userIp: string, userAgent?: string): Promise<void>;
  getPromptUsageCount(periodHours: number): Promise<number>;
  getUserPromptUsageCount(userIp: string, minutesAgo: number): Promise<number>;
  getPromptUsageStats(): Promise<{ total: number; todayCount: number; currentHourCount: number }>;
  
  // Configuration Presets
  createConfigurationPreset(preset: InsertConfigurationPreset): Promise<ConfigurationPreset>;
  getAllConfigurationPresets(): Promise<ConfigurationPreset[]>;
  getConfigurationPresetById(id: number): Promise<ConfigurationPreset | undefined>;
  getActiveConfigurationPreset(): Promise<ConfigurationPreset | undefined>;
  updateConfigurationPreset(id: number, preset: Partial<InsertConfigurationPreset>): Promise<ConfigurationPreset>;
  deleteConfigurationPreset(id: number): Promise<void>;
  setActiveConfigurationPreset(id: number): Promise<ConfigurationPreset>;
  
  // Quality Improvement System
  createPromptIteration(iteration: InsertPromptIteration): Promise<PromptIteration>;
  getPromptIterations(originalPromptId: number): Promise<PromptIteration[]>;
  getLatestPromptIteration(originalPromptId: number): Promise<PromptIteration | undefined>;
  
  // Improvement Suggestions Cache
  cacheImprovementSuggestions(cache: InsertImprovementSuggestionsCache): Promise<ImprovementSuggestionsCache>;
  getCachedImprovementSuggestions(promptId: number, suggestionType: string): Promise<ImprovementSuggestionsCache | undefined>;
  clearSuggestionsCache(promptId: number): Promise<void>;
  
  // User Rating System
  recordUserVisit(userIdentifier: string): Promise<number>; // Returns visit count
  getUserVisitCount(userIdentifier: string): Promise<number>;
  createUserRating(userIdentifier: string, rating: string, visitNumber: number, feedback?: string): Promise<void>;
  getUserRatings(): Promise<Array<{ rating: string; visitNumber: number; count: number; feedback?: string }>>;
  getRatingStats(): Promise<{ totalRatings: number; averageRating: number; ratingDistribution: Record<string, number> }>;
  
  // User Authentication System
  createUser(user: InsertUser): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  updateUser(id: number, data: Partial<InsertUser>): Promise<User>;
  
  // Token Management System
  getUserTokens(userId: number): Promise<UserTokens | undefined>;
  createUserTokens(tokens: InsertUserTokens): Promise<UserTokens>;
  updateUserTokens(userId: number, data: Partial<InsertUserTokens>): Promise<UserTokens>;
  consumeTokens(userId: number, amount: number, operation: string, description?: string): Promise<boolean>;
  
  // Document Generation System
  createGeneratedDocument(document: InsertGeneratedDocument): Promise<GeneratedDocument>;
  getGeneratedDocument(id: number): Promise<GeneratedDocument | undefined>;
  getUserDocuments(userId: number, limit?: number, offset?: number): Promise<GeneratedDocument[]>;
  updateDocumentDownloadCount(id: number): Promise<void>;
  
  // Token Transactions System
  createTokenTransaction(transaction: InsertTokenTransaction): Promise<TokenTransactionMain>;
  getUserTokenTransactions(userId: number, limit?: number, offset?: number): Promise<TokenTransactionMain[]>;

  // Authentication methods
  loginUser(email: string, password: string): Promise<User>;
  registerUser(userData: { email: string; password: string; firstName?: string; lastName?: string }): Promise<User>;
  getUser(id: string): Promise<User | undefined>;

  // User Feedback Survey System
  createFeedbackSurvey(survey: InsertUserFeedbackSurvey): Promise<UserFeedbackSurvey>;
  getLastFeedbackSurvey(userIdentifier: string): Promise<UserFeedbackSurvey | undefined>;
  shouldShowFeedbackSurvey(userIdentifier: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async createLegalPrompt(prompt: InsertLegalPrompt): Promise<LegalPrompt> {
    const [createdPrompt] = await db
      .insert(legalPrompts)
      .values(prompt)
      .returning();
    return createdPrompt;
  }

  async getAllLegalPrompts(): Promise<LegalPrompt[]> {
    return await db
      .select()
      .from(legalPrompts)
      .orderBy(desc(legalPrompts.createdAt));
  }

  async getPaginatedLegalPrompts(offset: number, limit: number): Promise<{ prompts: LegalPrompt[]; total: number }> {
    const [prompts, totalResult] = await Promise.all([
      db
        .select()
        .from(legalPrompts)
        .orderBy(desc(legalPrompts.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(legalPrompts)
    ]);
    
    // For each prompt, get the latest version with highest score
    const promptsWithLatestVersions = await Promise.all(
      prompts.map(async (prompt) => {
        return await this.getLatestPromptVersion(prompt.id);
      })
    );
    
    return {
      prompts: promptsWithLatestVersions,
      total: totalResult[0]?.count || 0
    };
  }

  async getLegalPromptById(id: number): Promise<LegalPrompt | undefined> {
    const [prompt] = await db
      .select()
      .from(legalPrompts)
      .where(eq(legalPrompts.id, id));
    return prompt || undefined;
  }

  async getAdminSettings(): Promise<AdminSettings> {
    const [settings] = await db
      .select()
      .from(adminSettings)
      .limit(1);
    
    if (!settings) {
      // Create default settings if none exist
      const [defaultSettings] = await db
        .insert(adminSettings)
        .values({
          activeAiModel: "claude",
          openaiEnabled: false,
          claudeEnabled: true,
          geminiEnabled: false,
          supabaseEnabled: false,
        })
        .returning();
      return defaultSettings;
    }
    
    return settings;
  }

  async updateAdminSettings(newSettings: Partial<InsertAdminSettings>): Promise<AdminSettings> {
    const currentSettings = await this.getAdminSettings();
    
    const [updatedSettings] = await db
      .update(adminSettings)
      .set({
        ...newSettings,
        updatedAt: new Date(),
      })
      .where(eq(adminSettings.id, currentSettings.id))
      .returning();
    
    return updatedSettings;
  }

  async getPromptsByRegion(): Promise<Array<{ region: string; count: number }>> {
    const results = await db
      .select({
        region: sql<string>`COALESCE(${legalPrompts.region}, 'Não informado')`,
        count: sql<number>`COUNT(*)`,
      })
      .from(legalPrompts)
      .groupBy(sql`COALESCE(${legalPrompts.region}, 'Não informado')`)
      .orderBy(sql`COUNT(*) DESC`);
    
    return results;
  }

  async getPromptsByAiModel(): Promise<Array<{ aiModel: string; count: number }>> {
    const results = await db
      .select({
        aiModel: sql<string>`COALESCE(${legalPrompts.aiModel}, 'Não informado')`,
        count: sql<number>`COUNT(*)`,
      })
      .from(legalPrompts)
      .groupBy(sql`COALESCE(${legalPrompts.aiModel}, 'Não informado')`)
      .orderBy(sql`COUNT(*) DESC`);
    
    return results;
  }

  async getPromptsByMonth(): Promise<Array<{ month: string; count: number }>> {
    const results = await db
      .select({
        month: sql<string>`TO_CHAR(${legalPrompts.createdAt}, 'YYYY-MM')`,
        count: sql<number>`COUNT(*)`,
      })
      .from(legalPrompts)
      .groupBy(sql`TO_CHAR(${legalPrompts.createdAt}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${legalPrompts.createdAt}, 'YYYY-MM')`);
    
    return results;
  }

  // Prompt Usage Tracking methods
  async recordPromptUsage(userIp: string, userAgent?: string): Promise<void> {
    await db.insert(promptUsage).values({
      userIp,
      userAgent,
    });
  }

  async getPromptUsageCount(periodHours: number): Promise<number> {
    const cutoffTime = new Date(Date.now() - periodHours * 60 * 60 * 1000);
    
    const [result] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(promptUsage)
      .where(sql`${promptUsage.createdAt} >= ${cutoffTime}`);
    
    return result?.count || 0;
  }

  async getUserPromptUsageCount(userIp: string, minutesAgo: number): Promise<number> {
    const cutoffTime = new Date(Date.now() - minutesAgo * 60 * 1000);
    
    const [result] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(promptUsage)
      .where(sql`${promptUsage.userIp} = ${userIp} AND ${promptUsage.createdAt} >= ${cutoffTime}`);
    
    return result?.count || 0;
  }

  async getPromptUsageStats(): Promise<{ total: number; todayCount: number; currentHourCount: number }> {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const hourStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());

    // Total count
    const [totalResult] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(promptUsage);

    // Today count
    const [todayResult] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(promptUsage)
      .where(sql`${promptUsage.createdAt} >= ${todayStart}`);

    // Current hour count
    const [hourResult] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(promptUsage)
      .where(sql`${promptUsage.createdAt} >= ${hourStart}`);

    return {
      total: totalResult?.count || 0,
      todayCount: todayResult?.count || 0,
      currentHourCount: hourResult?.count || 0,
    };
  }

  // Configuration Presets Methods
  async createConfigurationPreset(preset: InsertConfigurationPreset): Promise<ConfigurationPreset> {
    const [createdPreset] = await db
      .insert(configurationPresets)
      .values(preset)
      .returning();
    return createdPreset;
  }

  async getAllConfigurationPresets(): Promise<ConfigurationPreset[]> {
    return await db
      .select()
      .from(configurationPresets)
      .orderBy(desc(configurationPresets.createdAt));
  }

  async getConfigurationPresetById(id: number): Promise<ConfigurationPreset | undefined> {
    const [preset] = await db
      .select()
      .from(configurationPresets)
      .where(eq(configurationPresets.id, id));
    return preset || undefined;
  }

  async getActiveConfigurationPreset(): Promise<ConfigurationPreset | undefined> {
    const [preset] = await db
      .select()
      .from(configurationPresets)
      .where(eq(configurationPresets.isActive, true));
    return preset || undefined;
  }

  async updateConfigurationPreset(id: number, preset: Partial<InsertConfigurationPreset>): Promise<ConfigurationPreset> {
    const [updatedPreset] = await db
      .update(configurationPresets)
      .set({ ...preset, updatedAt: new Date() })
      .where(eq(configurationPresets.id, id))
      .returning();
    return updatedPreset;
  }

  async deleteConfigurationPreset(id: number): Promise<void> {
    await db
      .delete(configurationPresets)
      .where(eq(configurationPresets.id, id));
  }

  async setActiveConfigurationPreset(id: number): Promise<ConfigurationPreset> {
    // First, deactivate all presets
    await db
      .update(configurationPresets)
      .set({ isActive: false, updatedAt: new Date() });

    // Then activate the selected preset
    const [activePreset] = await db
      .update(configurationPresets)
      .set({ isActive: true, updatedAt: new Date() })
      .where(eq(configurationPresets.id, id))
      .returning();
    
    return activePreset;
  }

  // Quality Improvement System Methods
  async createPromptIteration(iteration: InsertPromptIteration): Promise<PromptIteration> {
    const [createdIteration] = await db
      .insert(promptIterations)
      .values(iteration)
      .returning();
    return createdIteration;
  }

  async getPromptIterations(originalPromptId: number): Promise<PromptIteration[]> {
    return await db
      .select()
      .from(promptIterations)
      .where(eq(promptIterations.originalPromptId, originalPromptId))
      .orderBy(desc(promptIterations.iterationNumber));
  }

  async getLatestPromptIteration(originalPromptId: number): Promise<PromptIteration | undefined> {
    const [iteration] = await db
      .select()
      .from(promptIterations)
      .where(eq(promptIterations.originalPromptId, originalPromptId))
      .orderBy(desc(promptIterations.iterationNumber))
      .limit(1);
    return iteration || undefined;
  }

  async getLatestPromptVersion(originalPromptId: number): Promise<LegalPrompt> {
    // First get the latest iteration with highest score
    const latestIteration = await db
      .select()
      .from(promptIterations)
      .where(eq(promptIterations.originalPromptId, originalPromptId))
      .orderBy(desc(promptIterations.relevanceScore), desc(promptIterations.createdAt))
      .limit(1);

    if (latestIteration.length > 0) {
      // Convert iteration to LegalPrompt format
      const iteration = latestIteration[0];
      return {
        id: originalPromptId,
        userRequest: iteration.userRequest,
        legalPrompt: iteration.legalPrompt,
        documentType: iteration.documentType,
        areaTags: iteration.areaTags,
        region: null,
        city: null,
        relevanceScore: iteration.relevanceScore,
        relevanceReasoning: iteration.relevanceReasoning,
        relevanceSuggestions: iteration.relevanceSuggestions,
        aiModel: iteration.aiModel,
        createdAt: iteration.createdAt || new Date(),
      };
    }

    // If no iterations exist, return the original prompt
    const originalPrompt = await this.getLegalPromptById(originalPromptId);
    if (!originalPrompt) {
      throw new Error('Prompt not found');
    }
    return originalPrompt;
  }

  // Improvement Suggestions Cache Methods
  async cacheImprovementSuggestions(cache: InsertImprovementSuggestionsCache): Promise<ImprovementSuggestionsCache> {
    const [cachedSuggestions] = await db
      .insert(improvementSuggestionsCache)
      .values(cache)
      .returning();
    return cachedSuggestions;
  }

  async getCachedImprovementSuggestions(promptId: number, suggestionType: string): Promise<ImprovementSuggestionsCache | undefined> {
    const [cached] = await db
      .select()
      .from(improvementSuggestionsCache)
      .where(and(
        eq(improvementSuggestionsCache.promptId, promptId),
        eq(improvementSuggestionsCache.suggestionType, suggestionType)
      ))
      .orderBy(desc(improvementSuggestionsCache.createdAt))
      .limit(1);
    return cached || undefined;
  }

  async clearSuggestionsCache(promptId: number): Promise<void> {
    await db
      .delete(improvementSuggestionsCache)
      .where(eq(improvementSuggestionsCache.promptId, promptId));
  }

  // User Rating System Implementation
  async recordUserVisit(userIdentifier: string): Promise<number> {
    const [existing] = await db
      .select()
      .from(userVisits)
      .where(eq(userVisits.userIdentifier, userIdentifier))
      .limit(1);

    if (existing) {
      const [updated] = await db
        .update(userVisits)
        .set({ 
          visitCount: existing.visitCount + 1,
          lastVisit: new Date()
        })
        .where(eq(userVisits.userIdentifier, userIdentifier))
        .returning();
      return updated.visitCount;
    } else {
      const [created] = await db
        .insert(userVisits)
        .values({ userIdentifier, visitCount: 1 })
        .returning();
      return created.visitCount;
    }
  }

  async getUserVisitCount(userIdentifier: string): Promise<number> {
    const [result] = await db
      .select({ visitCount: userVisits.visitCount })
      .from(userVisits)
      .where(eq(userVisits.userIdentifier, userIdentifier))
      .limit(1);
    return result?.visitCount || 0;
  }

  async createUserRating(userIdentifier: string, rating: string, visitNumber: number, feedback?: string): Promise<void> {
    await db
      .insert(userRatings)
      .values({ userIdentifier, rating, visitNumber, feedback });
  }

  async getUserRatings(): Promise<Array<{ rating: string; visitNumber: number; count: number; feedback?: string }>> {
    const ratings = await db
      .select({
        rating: userRatings.rating,
        visitNumber: userRatings.visitNumber,
        count: sql<number>`count(*)`,
        feedback: userRatings.feedback
      })
      .from(userRatings)
      .groupBy(userRatings.rating, userRatings.visitNumber, userRatings.feedback)
      .orderBy(desc(sql`count(*)`));
    
    return ratings;
  }

  async getRatingStats(): Promise<{ totalRatings: number; averageRating: number; ratingDistribution: Record<string, number> }> {
    const ratingValues = {
      'very_bad': 1,
      'bad': 2,
      'neutral': 3,
      'good': 4,
      'very_good': 5
    };

    const ratings = await db
      .select({
        rating: userRatings.rating,
        count: sql<number>`count(*)`
      })
      .from(userRatings)
      .groupBy(userRatings.rating);

    let totalRatings = 0;
    let weightedSum = 0;
    const distribution: Record<string, number> = {};

    ratings.forEach(({ rating, count }) => {
      totalRatings += count;
      weightedSum += (ratingValues[rating as keyof typeof ratingValues] || 3) * count;
      distribution[rating] = count;
    });

    const averageRating = totalRatings > 0 ? weightedSum / totalRatings : 0;

    return {
      totalRatings,
      averageRating,
      ratingDistribution: distribution
    };
  }

  // User Authentication System Implementation
  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    
    // Create initial token balance for new user
    await this.createUserTokens({
      userId: newUser.id,
      currentBalance: 10, // Free plan default
      planTokens: 10,
      billingPeriodStart: new Date(),
    });
    
    return newUser;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async updateUser(id: number, data: Partial<InsertUser>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  // Token Management System Implementation
  async getUserTokens(userId: number): Promise<UserTokens | undefined> {
    const [tokens] = await db.select().from(userTokens).where(eq(userTokens.userId, userId));
    return tokens;
  }

  async createUserTokens(tokens: InsertUserTokens): Promise<UserTokens> {
    const [newTokens] = await db.insert(userTokens).values(tokens).returning();
    return newTokens;
  }

  async updateUserTokens(userId: number, data: Partial<InsertUserTokens>): Promise<UserTokens> {
    const [updatedTokens] = await db
      .update(userTokens)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(userTokens.userId, userId))
      .returning();
    return updatedTokens;
  }

  async consumeTokens(userId: number, amount: number, operation: string, description?: string): Promise<boolean> {
    const currentTokens = await this.getUserTokens(userId);
    if (!currentTokens || currentTokens.currentBalance < amount) {
      return false;
    }

    const newBalance = currentTokens.currentBalance - amount;
    
    // Update token balance
    await this.updateUserTokens(userId, {
      currentBalance: newBalance,
      totalConsumed: currentTokens.totalConsumed + amount
    });

    // Record transaction
    await this.createTokenTransaction({
      userId,
      type: 'consumption',
      amount: -amount,
      operation,
      description,
      balanceAfter: newBalance
    });

    return true;
  }

  // Document Generation System Implementation
  async createGeneratedDocument(document: InsertGeneratedDocument): Promise<GeneratedDocument> {
    const [newDocument] = await db.insert(generatedDocuments).values(document).returning();
    return newDocument;
  }

  async getGeneratedDocument(id: number): Promise<GeneratedDocument | undefined> {
    const [document] = await db.select().from(generatedDocuments).where(eq(generatedDocuments.id, id));
    return document;
  }

  async getUserDocuments(userId: number, limit = 20, offset = 0): Promise<GeneratedDocument[]> {
    return await db
      .select()
      .from(generatedDocuments)
      .where(eq(generatedDocuments.userId, userId))
      .orderBy(desc(generatedDocuments.generatedAt))
      .limit(limit)
      .offset(offset);
  }

  async updateDocumentDownloadCount(id: number): Promise<void> {
    await db
      .update(generatedDocuments)
      .set({ downloadCount: sql`${generatedDocuments.downloadCount} + 1` })
      .where(eq(generatedDocuments.id, id));
  }

  // Token Transactions System Implementation
  async createTokenTransaction(transaction: InsertTokenTransaction): Promise<TokenTransactionMain> {
    const [newTransaction] = await db.insert(tokenTransactionsMain).values(transaction).returning();
    return newTransaction;
  }

  async getUserTokenTransactions(userId: number, limit = 50, offset = 0): Promise<TokenTransactionMain[]> {
    return await db
      .select()
      .from(tokenTransactionsMain)
      .where(eq(tokenTransactionsMain.userId, userId))
      .orderBy(desc(tokenTransactionsMain.createdAt))
      .limit(limit)
      .offset(offset);
  }

  // Additional Authentication Functions (removed duplicates - using earlier implementations)

  async consumeUserTokens(userId: number, amount: number, operation: string, documentId?: number): Promise<void> {
    // Get current token balance
    const tokens = await this.getUserTokens(userId);
    
    if (tokens.currentBalance < amount) {
      throw new Error('Insufficient tokens');
    }

    const newBalance = tokens.currentBalance - amount;

    // Update token balance
    await db
      .update(userTokens)
      .set({
        currentBalance: newBalance,
        totalConsumed: tokens.totalConsumed + amount,
        updatedAt: new Date()
      })
      .where(eq(userTokens.userId, userId));

    // Record transaction
    await this.createTokenTransaction({
      userId,
      type: 'consume',
      amount: -amount,
      operation,
      documentId,
      description: `Tokens consumed for ${operation}`,
      balanceAfter: newBalance
    });
  }

  async getPromptById(id: number): Promise<LegalPrompt | undefined> {
    return await this.getLegalPromptById(id);
  }

  // Authentication methods implementation
  async loginUser(email: string, password: string): Promise<User> {
    // Find user by email
    const [user] = await db.select().from(users).where(eq(users.email, email));
    
    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    // For now, simple password comparison (you should use bcrypt in production)
    if (user.passwordHash !== password) {
      throw new Error('Senha incorreta');
    }

    return user;
  }

  async registerUser(userData: { email: string; password: string; firstName?: string; lastName?: string }): Promise<User> {
    // Check if user already exists
    const [existingUser] = await db.select().from(users).where(eq(users.email, userData.email));
    
    if (existingUser) {
      throw new Error('Usuário já existe com este email');
    }

    // Create new user
    const [newUser] = await db.insert(users).values({
      email: userData.email,
      passwordHash: userData.password, // In production, hash this with bcrypt
      name: userData.firstName ? `${userData.firstName} ${userData.lastName || ''}`.trim() : '',
      firstName: userData.firstName,
      lastName: userData.lastName,
      tokenBalance: 1700, // Free tier tokens for new users
      currentPlan: 'free'
    }).returning();

    // Create token record for the user
    await this.createUserTokens({
      userId: newUser.id,
      currentBalance: 1700,
      totalPurchased: 1700,
      totalConsumed: 0
    });

    return newUser;
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, parseInt(id)));
    return user;
  }

  // User Feedback Survey System Implementation
  async createFeedbackSurvey(survey: InsertUserFeedbackSurvey): Promise<UserFeedbackSurvey> {
    const [createdSurvey] = await db
      .insert(userFeedbackSurveys)
      .values(survey)
      .returning();
    return createdSurvey;
  }

  async getLastFeedbackSurvey(userIdentifier: string): Promise<UserFeedbackSurvey | undefined> {
    const [survey] = await db
      .select()
      .from(userFeedbackSurveys)
      .where(eq(userFeedbackSurveys.userIdentifier, userIdentifier))
      .orderBy(desc(userFeedbackSurveys.createdAt))
      .limit(1);
    return survey;
  }

  async shouldShowFeedbackSurvey(userIdentifier: string): Promise<boolean> {
    const lastSurvey = await this.getLastFeedbackSurvey(userIdentifier);
    
    if (!lastSurvey) {
      return true; // First time user, show survey
    }

    // Check if 7 days (604800000 ms) have passed since last survey
    const sevenDaysAgo = new Date(Date.now() - 604800000);
    return lastSurvey.createdAt < sevenDaysAgo;
  }
}

export const storage = new DatabaseStorage();
