import { db } from './db';
import { 
  contractUsers, 
  userTokenBalance, 
  contractAnalyses, 
  tokenTransactions,
  contractSystemSettings,
  type ContractUser,
  type InsertContractUser,
  type UserTokenBalance,
  type InsertUserTokenBalance,
  type ContractAnalysis,
  type InsertContractAnalysis,
  type TokenTransaction,
  type InsertTokenTransaction,
  type ContractSystemSettings
} from '../shared/schema';
import { eq, desc, and, gte, lte, sql } from 'drizzle-orm';

export interface IContractStorage {
  // User management
  createUser(user: InsertContractUser): Promise<ContractUser>;
  getUserByEmail(email: string): Promise<ContractUser | undefined>;
  getUserById(id: number): Promise<ContractUser | undefined>;
  updateUser(id: number, data: Partial<InsertContractUser>): Promise<ContractUser>;
  updateUserSubscription(userId: number, plan: string, status: string, stripeCustomerId?: string): Promise<ContractUser>;
  
  // Token management
  getUserTokenBalance(userId: number): Promise<UserTokenBalance | undefined>;
  updateTokenBalance(userId: number, balance: Partial<InsertUserTokenBalance>): Promise<UserTokenBalance>;
  consumeTokens(userId: number, amount: number, operation: string, description?: string): Promise<boolean>;
  addTokens(userId: number, amount: number, source: string, description?: string): Promise<UserTokenBalance>;
  
  // Contract analyses
  createContractAnalysis(analysis: InsertContractAnalysis): Promise<ContractAnalysis>;
  getContractAnalysis(id: number): Promise<ContractAnalysis | undefined>;
  getUserContractAnalyses(userId: number, limit: number, offset: number): Promise<ContractAnalysis[]>;
  updateContractAnalysis(id: number, updates: Partial<InsertContractAnalysis>): Promise<ContractAnalysis>;
  
  // Token transactions
  createTokenTransaction(transaction: InsertTokenTransaction): Promise<TokenTransaction>;
  getUserTokenTransactions(userId: number, limit: number, offset: number): Promise<TokenTransaction[]>;
  
  // System settings
  getSystemSettings(): Promise<ContractSystemSettings | undefined>;
  updateSystemSettings(settings: Partial<ContractSystemSettings>): Promise<ContractSystemSettings>;
  
  // Analytics
  getSystemStats(): Promise<{
    totalUsers: number;
    totalAnalyses: number;
    totalTokensConsumed: number;
    monthlyRevenue: number;
  }>;
  getUserStats(userId: number): Promise<{
    totalAnalyses: number;
    tokensUsed: number;
    averageScore: number;
    lastAnalysis: Date | null;
  }>;
}

export class ContractDatabaseStorage implements IContractStorage {
  async createUser(user: InsertContractUser): Promise<ContractUser> {
    const [newUser] = await db.insert(contractUsers).values(user).returning();
    
    // Create initial token balance
    await db.insert(userTokenBalance).values({
      userId: newUser.id,
      currentBalance: 500, // Free tier tokens
      planTokens: 500
    });
    
    return newUser;
  }

  async getUserByEmail(email: string): Promise<ContractUser | undefined> {
    const [user] = await db.select().from(contractUsers).where(eq(contractUsers.email, email));
    return user;
  }

  async getUserById(id: number): Promise<ContractUser | undefined> {
    const [user] = await db.select().from(contractUsers).where(eq(contractUsers.id, id));
    return user;
  }

  async updateUser(id: number, data: Partial<InsertContractUser>): Promise<ContractUser> {
    const [updated] = await db
      .update(contractUsers)
      .set(data)
      .where(eq(contractUsers.id, id))
      .returning();
    
    return updated;
  }

  async updateUserSubscription(userId: number, plan: string, status: string, stripeCustomerId?: string): Promise<ContractUser> {
    const updateData: any = {
      currentPlan: plan,
      subscriptionStatus: status
    };
    
    if (stripeCustomerId) {
      updateData.stripeCustomerId = stripeCustomerId;
    }

    const [updated] = await db
      .update(contractUsers)
      .set(updateData)
      .where(eq(contractUsers.id, userId))
      .returning();
    
    return updated;
  }

  async getUserTokenBalance(userId: number): Promise<UserTokenBalance | undefined> {
    const [balance] = await db
      .select()
      .from(userTokenBalance)
      .where(eq(userTokenBalance.userId, userId));
    return balance;
  }

  async updateTokenBalance(userId: number, balance: Partial<InsertUserTokenBalance>): Promise<UserTokenBalance> {
    const [updated] = await db
      .update(userTokenBalance)
      .set({ ...balance, updatedAt: new Date() })
      .where(eq(userTokenBalance.userId, userId))
      .returning();
    
    return updated;
  }

  async consumeTokens(userId: number, amount: number, operation: string, description?: string): Promise<boolean> {
    const balance = await this.getUserTokenBalance(userId);
    if (!balance || (balance.currentBalance ?? 0) < amount) {
      return false;
    }

    // Update balance
    await this.updateTokenBalance(userId, {
      currentBalance: (balance.currentBalance || 0) - amount,
      totalConsumed: (balance.totalConsumed || 0) + amount
    });

    // Record transaction
    await this.createTokenTransaction({
      userId,
      transactionType: 'consumption',
      operation,
      tokensAmount: -amount,
      description: description || `Consumo de tokens: ${operation}`
    });

    return true;
  }

  async addTokens(userId: number, amount: number, source: string, description?: string): Promise<UserTokenBalance> {
    const balance = await this.getUserTokenBalance(userId);
    if (!balance) {
      throw new Error('Token balance not found');
    }

    const updated = await this.updateTokenBalance(userId, {
      currentBalance: (balance.currentBalance || 0) + amount,
      totalPurchased: (balance.totalPurchased || 0) + amount
    });

    // Record transaction
    await this.createTokenTransaction({
      userId,
      transactionType: 'purchase',
      operation: source,
      tokensAmount: amount,
      description: description || `Adição de tokens: ${source}`
    });

    return updated;
  }

  async createContractAnalysis(analysis: InsertContractAnalysis): Promise<ContractAnalysis> {
    const [newAnalysis] = await db.insert(contractAnalyses).values(analysis).returning();
    return newAnalysis;
  }

  async getContractAnalysis(id: number): Promise<ContractAnalysis | undefined> {
    const [analysis] = await db
      .select()
      .from(contractAnalyses)
      .where(eq(contractAnalyses.id, id));
    return analysis;
  }

  async getUserContractAnalyses(userId: number, limit: number = 20, offset: number = 0): Promise<ContractAnalysis[]> {
    return await db
      .select()
      .from(contractAnalyses)
      .where(eq(contractAnalyses.userId, userId))
      .orderBy(desc(contractAnalyses.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async updateContractAnalysis(id: number, updates: Partial<InsertContractAnalysis>): Promise<ContractAnalysis> {
    const [updated] = await db
      .update(contractAnalyses)
      .set(updates)
      .where(eq(contractAnalyses.id, id))
      .returning();
    
    return updated;
  }

  async createTokenTransaction(transaction: InsertTokenTransaction): Promise<TokenTransaction> {
    const [newTransaction] = await db.insert(tokenTransactions).values(transaction).returning();
    return newTransaction;
  }

  async getUserTokenTransactions(userId: number, limit: number = 50, offset: number = 0): Promise<TokenTransaction[]> {
    return await db
      .select()
      .from(tokenTransactions)
      .where(eq(tokenTransactions.userId, userId))
      .orderBy(desc(tokenTransactions.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getSystemSettings(): Promise<ContractSystemSettings | undefined> {
    const [settings] = await db.select().from(contractSystemSettings).limit(1);
    return settings;
  }

  async updateSystemSettings(settings: Partial<ContractSystemSettings>): Promise<ContractSystemSettings> {
    const existing = await this.getSystemSettings();
    
    if (existing) {
      const [updated] = await db
        .update(contractSystemSettings)
        .set({ ...settings, updatedAt: new Date() })
        .where(eq(contractSystemSettings.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(contractSystemSettings).values(settings).returning();
      return created;
    }
  }

  async getSystemStats(): Promise<{
    totalUsers: number;
    totalAnalyses: number;
    totalTokensConsumed: number;
    monthlyRevenue: number;
  }> {
    const [userCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(contractUsers);

    const [analysisCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(contractAnalyses);

    const [tokenUsage] = await db
      .select({ total: sql<number>`sum(${userTokenBalance.totalConsumed})` })
      .from(userTokenBalance);

    // Calculate monthly revenue (simplified - would need Stripe integration)
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const [monthlyRevenue] = await db
      .select({ total: sql<number>`count(*) * 49.90` }) // Simplified calculation
      .from(contractUsers)
      .where(
        and(
          eq(contractUsers.currentPlan, 'professional'),
          gte(contractUsers.createdAt, currentMonth)
        )
      );

    return {
      totalUsers: userCount.count || 0,
      totalAnalyses: analysisCount.count || 0,
      totalTokensConsumed: tokenUsage.total || 0,
      monthlyRevenue: monthlyRevenue.total || 0
    };
  }

  async getUserStats(userId: number): Promise<{
    totalAnalyses: number;
    tokensUsed: number;
    averageScore: number;
    lastAnalysis: Date | null;
  }> {
    const [stats] = await db
      .select({
        totalAnalyses: sql<number>`count(*)`,
        averageScore: sql<number>`avg(${contractAnalyses.overallScore})`,
        lastAnalysis: sql<Date>`max(${contractAnalyses.createdAt})`
      })
      .from(contractAnalyses)
      .where(eq(contractAnalyses.userId, userId));

    const balance = await this.getUserTokenBalance(userId);

    return {
      totalAnalyses: stats.totalAnalyses || 0,
      tokensUsed: balance?.totalConsumed || 0,
      averageScore: stats.averageScore || 0,
      lastAnalysis: stats.lastAnalysis || null
    };
  }
}

export const contractStorage = new ContractDatabaseStorage();