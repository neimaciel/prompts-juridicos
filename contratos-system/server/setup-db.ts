import { db } from './db';
import { sql } from 'drizzle-orm';
import { contractUsers, userTokenBalance, contractAnalyses, tokenTransactions } from '../shared/schema';

export async function setupDatabase() {
  try {
    console.log('Setting up contract analysis database...');
    
    // Create tables if they don't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS contract_users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        stripe_customer_id VARCHAR(255) UNIQUE,
        current_plan VARCHAR(50) DEFAULT 'free',
        subscription_status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_token_balance (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES contract_users(id) NOT NULL,
        current_balance INTEGER DEFAULT 0,
        total_purchased INTEGER DEFAULT 0,
        total_consumed INTEGER DEFAULT 0,
        plan_tokens INTEGER DEFAULT 0,
        billing_period_start TIMESTAMP,
        billing_period_end TIMESTAMP,
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS contract_analyses (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES contract_users(id) NOT NULL,
        original_filename VARCHAR(255),
        file_hash VARCHAR(64),
        file_size INTEGER,
        content_type VARCHAR(20) DEFAULT 'plain',
        extracted_text TEXT,
        encrypted_content TEXT,
        encryption_iv VARCHAR(32),
        encryption_tag VARCHAR(32),
        overall_score INTEGER,
        completeness_score INTEGER,
        compliance_score INTEGER,
        protection_score INTEGER,
        clarity_score INTEGER,
        contract_type VARCHAR(100),
        sensitive_data_detected JSONB,
        analysis_results JSONB,
        recommendations JSONB,
        tokens_consumed INTEGER,
        operation_breakdown JSONB,
        analysis_duration INTEGER,
        ai_model_used VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS token_transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES contract_users(id) NOT NULL,
        transaction_type VARCHAR(50) NOT NULL,
        amount INTEGER NOT NULL,
        balance_after INTEGER NOT NULL,
        description TEXT,
        reference_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    console.log('Database setup completed successfully');
    return true;
  } catch (error) {
    console.error('Database setup failed:', error);
    return false;
  }
}

export async function seedDatabase() {
  try {
    // Check if we already have test data
    const existingUsers = await db.select().from(contractUsers).limit(1);
    
    if (existingUsers.length === 0) {
      console.log('Seeding database with test data...');
      
      // Create test user
      const [testUser] = await db.insert(contractUsers).values({
        email: 'test@example.com',
        currentPlan: 'free'
      }).returning();
      
      // Create token balance for test user
      await db.insert(userTokenBalance).values({
        userId: testUser.id,
        currentBalance: 500, // Free plan tokens
        planTokens: 500
      });
      
      console.log('Test data seeded successfully');
    }
    
    return true;
  } catch (error) {
    console.error('Database seeding failed:', error);
    return false;
  }
}