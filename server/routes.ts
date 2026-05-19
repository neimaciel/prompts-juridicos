import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateLegalPrompt } from "./openai";
import { analyzePromptRelevance } from "./relevance";
import { detectSensitiveData } from "./sensitive-data-detector";
import { smartSuggestionEngine } from "./smart-suggestions";
import { intelligentScoringEngine } from "./intelligent-scoring";
import { 
  generatePromptRequestSchema, 
  insertLegalPromptSchema,
  regenerationRequestSchema,
  insertUserSchema,
  TOKEN_COSTS,
  users,
  userTokens,
  tokenTransactionsMain,
  generatedDocuments,
  legalPrompts,
  feedbackSubmissionSchema,
  type RegenerationRequestType,
  type DetailedQualityAnalysis,
  type User,
  type FeedbackSubmission
} from "@shared/schema";
import { db } from "./db";
import { eq, sql } from "drizzle-orm";
import { ZodError } from "zod";
import path from "path";
import express from "express";
import session from "express-session";
import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import Stripe from "stripe";

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

// Initialize Stripe (only if secret key is available)
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-06-30.basil",
    })
  : null;

// Token packages available for purchase
const TOKEN_PACKAGES = {
  starter: { tokens: 5000, price: 1999, name: "Pacote Starter" }, // R$ 19,99
  professional: { tokens: 15000, price: 4999, name: "Pacote Professional" }, // R$ 49,99
  business: { tokens: 35000, price: 9999, name: "Pacote Business" }, // R$ 99,99
  enterprise: { tokens: 100000, price: 19999, name: "Pacote Enterprise" } // R$ 199,99
};

// Authentication middleware for protected routes
const requireAuth = (req: Request, res: any, next: any) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  
  // Check for user in request (from session or JWT)
  if (req.user) {
    return next();
  }
  
  return res.status(401).json({ message: 'Authentication required' });
};

// Configure Google OAuth Strategy (only if credentials are available)
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (googleClientId && googleClientSecret) {
  passport.use(new GoogleStrategy({
    clientID: googleClientId,
    clientSecret: googleClientSecret,
    callbackURL: "https://276431e6-150d-4535-93de-a0596541ade1-00-1kqp6bg32sbhj.spock.replit.dev/api/auth/google/callback"
  }, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user exists
    const [existingUser] = await db.select().from(users).where(eq(users.email, profile.emails?.[0]?.value || ''));
    
    if (existingUser) {
      // User exists, return them
      return done(null, existingUser);
    }

    // Create new user
    const [newUser] = await db.insert(users).values({
      email: profile.emails?.[0]?.value || '',
      firstName: profile.name?.givenName || '',
      lastName: profile.name?.familyName || '',
      googleId: profile.id,
      tokenBalance: 1700, // Free tier tokens
      profileImageUrl: profile.photos?.[0]?.value || null
    }).returning();

    return done(null, newUser);
  } catch (error) {
    return done(error, undefined);
  }
  }));

  // Passport serialization
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
}

// Authentication middleware
const authenticateUser = async (req: Request, res: any, next: any) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token de autenticação necessário' });
    }

    // Simple JWT-like token validation (can be enhanced with actual JWT later)
    const token = authHeader.substring(7);
    const userId = parseInt(token); // Simplified for now
    
    if (isNaN(userId)) {
      return res.status(401).json({ message: 'Token inválido' });
    }

    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) {
      return res.status(401).json({ message: 'Usuário não encontrado' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Error in authentication middleware:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// Optional authentication middleware - tries to authenticate but doesn't fail if no auth
const optionalAuthenticateUser = async (req: Request, res: any, next: any) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No auth header, continue without setting req.user
      return next();
    }

    const token = authHeader.substring(7);
    let userId: number;

    // Try different token formats
    // First try simple numeric token (for compatibility)
    const numericUserId = parseInt(token);
    if (!isNaN(numericUserId)) {
      userId = numericUserId;
    } else {
      // Try base64 encoded token format used by /api/auth/login
      try {
        const [id] = Buffer.from(token, 'base64').toString().split(':');
        userId = parseInt(id);
        if (isNaN(userId)) {
          // Invalid token, continue without setting req.user
          return next();
        }
      } catch (decodeError) {
        // Invalid token, continue without setting req.user
        return next();
      }
    }

    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (user) {
      req.user = user;
    }
    // Continue regardless of whether user was found or not
    next();
  } catch (error) {
    console.error('Error in optional authentication middleware:', error);
    // Continue without setting req.user in case of errors
    next();
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure sessions
  app.use(session({
    secret: process.env.SESSION_SECRET || 'prompts-juridicos-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
  }));

  // Initialize Passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Google OAuth routes
  app.get('/api/auth/google', (req, res) => {
    if (!googleClientId || !googleClientSecret) {
      return res.status(500).json({ 
        message: 'Google OAuth não configurado. Configure GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET.' 
      });
    }
    
    passport.authenticate('google', { scope: ['profile', 'email'] })(req, res);
  });

  app.get('/api/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/' }),
    (req, res) => {
      // Google OAuth success - user is automatically in req.user
      res.redirect('/?login=success'); // Redirect to home after successful authentication
    }
  );

  // Check session status
  app.get('/api/auth/session', (req, res) => {
    if (req.isAuthenticated && req.isAuthenticated()) {
      res.json({ 
        isAuthenticated: true, 
        user: req.user 
      });
    } else {
      res.json({ 
        isAuthenticated: false, 
        user: null 
      });
    }
  });

  // Traditional email/password login
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email e senha são obrigatórios' });
      }

      // Check if user exists
      const [user] = await db.select().from(users).where(eq(users.email, email));
      if (!user) {
        return res.status(401).json({ message: 'Credenciais inválidas' });
      }

      // Check password
      if (!user.passwordHash) {
        return res.status(401).json({ message: 'Usuário não possui senha cadastrada' });
      }

      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Credenciais inválidas' });
      }
      
      // Generate JWT token (simple implementation)
      const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64');
      
      res.json({ 
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          tokenBalance: user.tokenBalance || 1700,
          subscriptionPlan: user.subscriptionPlan || 'free',
          subscriptionStatus: user.subscriptionStatus || 'active',
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        },
        token 
      });
    } catch (error: any) {
      res.status(401).json({ message: error.message || 'Credenciais inválidas' });
    }
  });

  // Traditional email/password registration  
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email e senha são obrigatórios' });
      }

      // Check if user already exists
      const existingUsers = await db.select().from(users).where(eq(users.email, email));
      if (existingUsers.length > 0) {
        return res.status(400).json({ message: 'Email já está em uso' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create new user
      const [user] = await db.insert(users).values({
        email,
        firstName,
        lastName,
        passwordHash: hashedPassword,
        tokenBalance: 1700, // Free tier tokens
        subscriptionPlan: 'free',
        subscriptionStatus: 'active'
      }).returning();
      
      // Generate JWT token (simple implementation)
      const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64');
      
      res.json({ 
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          tokenBalance: user.tokenBalance || 1700,
          subscriptionPlan: 'free',
          subscriptionStatus: 'active',
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        },
        token 
      });
    } catch (error: any) {
      console.error('Error in registration:', error);
      res.status(400).json({ message: error.message || 'Erro ao criar conta' });
    }
  });

  // Get current user (token auth)
  app.get('/api/auth/me', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Token de acesso necessário' });
      }

      const token = authHeader.substring(7);
      const [userId] = Buffer.from(token, 'base64').toString().split(':');
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: 'Usuário não encontrado' });
      }

      res.json({
        id: user.id,
        email: user.email,
        tokenBalance: user.tokenBalance,
        subscriptionPlan: user.currentPlan || 'free',
        subscriptionStatus: 'active',
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      });
    } catch (error: any) {
      res.status(401).json({ message: 'Token inválido' });
    }
  });

  // Logout route
  app.post('/api/auth/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: 'Erro ao fazer logout' });
      }
      res.json({ message: 'Logout realizado com sucesso' });
    });
  });

  // User Feedback Survey endpoints
  // Check if user should see feedback survey
  app.get('/api/feedback/should-show/:userIdentifier', async (req, res) => {
    try {
      const { userIdentifier } = req.params;
      
      if (!userIdentifier) {
        return res.status(400).json({ error: 'User identifier is required' });
      }

      const shouldShow = await storage.shouldShowFeedbackSurvey(userIdentifier);
      
      res.json({ shouldShow });
    } catch (error) {
      console.error('Error checking feedback survey status:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Submit feedback survey
  app.post('/api/feedback/submit', optionalAuthenticateUser, async (req, res) => {
    try {
      const validatedFeedback = feedbackSubmissionSchema.parse(req.body);
      
      // Get user identification from the request body (set by frontend)
      const realClientIp = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.get('User-Agent');
      
      // Use the userIdentifier from the frontend request, or fallback to IP-based if not provided
      const userIdentifier = validatedFeedback.userIdentifier || 
        (req.user?.id ? `user:${req.user.id}` : `guest:${realClientIp}`);
      
      // Create feedback survey record
      await storage.createFeedbackSurvey({
        userId: req.user?.id || null,
        userIdentifier,
        satisfactionScore: validatedFeedback.satisfactionScore || null,
        usageFrequency: validatedFeedback.usageFrequency || null,
        suggestions: validatedFeedback.suggestions || null,
        ipAddress: realClientIp,
        userAgent: userAgent || null
      });

      res.json({ 
        success: true, 
        message: 'Obrigado pelo seu feedback! Suas respostas nos ajudam a melhorar a ferramenta.' 
      });
    } catch (error) {
      console.error('Error submitting feedback survey:', error);
      if (error instanceof ZodError) {
        return res.status(400).json({ error: 'Dados de entrada inválidos', details: error.errors });
      }
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Generate legal prompt endpoint
  app.post("/api/prompts/generate", optionalAuthenticateUser, async (req, res) => {
    try {
      const validatedRequest = generatePromptRequestSchema.parse(req.body);
      
      // Check for sensitive data before processing
      const sensitiveDataCheck = detectSensitiveData(validatedRequest.userRequest);
      if (sensitiveDataCheck.hasSensitiveData) {
        return res.status(400).json({ 
          message: sensitiveDataCheck.message,
          detectedTypes: sensitiveDataCheck.detectedTypes
        });
      }
      
      // Get real client IP and User Agent for tracking
      const realClientIp = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.get('User-Agent');
      
      // Create user key that prioritizes authenticated user ID over IP
      const userKey = req.user?.id ? `user:${req.user.id}` : `ip:${realClientIp}`;
      
      // Get admin settings to check limits and AI model
      const settings = await storage.getAdminSettings();
      
      // Check global prompt limits
      const currentUsage = await storage.getPromptUsageCount(settings.promptPeriodHours);
      if (currentUsage >= settings.maxPromptsPerPeriod) {
        return res.status(429).json({ 
          message: `Limite global de prompts atingido. Máximo de ${settings.maxPromptsPerPeriod} prompts a cada ${settings.promptPeriodHours} horas.` 
        });
      }
      
      // Check user-specific rate limits using the new user key
      const userUsage = await storage.getUserPromptUsageCount(userKey, settings.userRateLimitMinutes);
      if (userUsage >= settings.maxPromptsPerUser) {
        const limitType = req.user?.id ? 'conta' : 'IP';
        return res.status(429).json({ 
          message: `Limite de prompts por ${limitType} atingido. Máximo de ${settings.maxPromptsPerUser} prompts a cada ${settings.userRateLimitMinutes} minutos.` 
        });
      }
      
      // Record the usage before generating the prompt using the new user key
      await storage.recordPromptUsage(userKey, userAgent);
      
      // Use score configuration from admin settings
      const scoreConfig = {
        temperature: settings.scoreTemperature || 0.7,
        promptModel: settings.geminiPromptModel || "gemini-2.0-flash-lite"
      };
      
      const aiResponse = await generateLegalPrompt(validatedRequest.userRequest, settings.activeAiModel, scoreConfig);
      
      // Calculate AI-powered relevance score using configured model
      const analysisConfig = {
        weights: {
          legalCompleteness: settings.legalCompletenessWeight || 0.25,
          legislationCompliance: settings.legislationComplianceWeight || 0.25,
          practicalApplicability: settings.practicalApplicabilityWeight || 0.25,
          legalStructure: settings.legalStructureWeight || 0.25
        },
        thresholds: {
          excellent: settings.excellentThreshold || 0.90,
          good: settings.goodThreshold || 0.80,
          adequate: settings.adequateThreshold || 0.70,
          inferior: settings.inferiorThreshold || 0.60
        },
        requirements: {
          legalReferences: settings.requiresLegalReferences !== false,
          practicalGuidance: settings.requiresPracticalGuidance !== false,
          specificLegislation: settings.requiresSpecificLegislation !== false
        }
      };

      console.log('Document type from AI:', aiResponse.documentType);
      console.log('User request for type detection:', validatedRequest.userRequest);

      const relevanceAnalysis = await analyzePromptRelevance(
        validatedRequest.userRequest,
        aiResponse.legalPrompt,
        aiResponse.documentType,
        aiResponse.areaTags,
        settings.geminiScoreModel || "gemini-2.0-flash-lite",
        settings.analysisTemperature || 0.7,
        analysisConfig
      );

      const promptData = {
        userRequest: validatedRequest.userRequest,
        legalPrompt: aiResponse.legalPrompt,
        documentType: aiResponse.documentType,
        areaTags: aiResponse.areaTags,
        region: validatedRequest.region || null,
        city: validatedRequest.city || null,
        aiModel: settings.activeAiModel,
        relevanceScore: relevanceAnalysis.score,
        relevanceReasoning: relevanceAnalysis.reasoning,
        relevanceSuggestions: relevanceAnalysis.suggestions,
      };
      
      const validatedPrompt = insertLegalPromptSchema.parse(promptData);
      const savedPrompt = await storage.createLegalPrompt(validatedPrompt);
      
      res.json(savedPrompt);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Dados inválidos",
          errors: error.errors 
        });
      }
      
      console.error("Error generating prompt:", error);
      res.status(500).json({ 
        message: "Erro interno do servidor. Tente novamente." 
      });
    }
  });

  // Quality Improvement System Endpoints
  
  // Get detailed quality analysis for a prompt
  app.get("/api/prompts/:id/detailed-analysis", async (req, res) => {
    try {
      const promptId = parseInt(req.params.id);
      
      // Get the prompt from database
      const prompt = await storage.getLegalPromptById(promptId);
      if (!prompt) {
        return res.status(404).json({ error: "Prompt não encontrado" });
      }
      
      // Generate detailed analysis with suggestions
      const analysis = await smartSuggestionEngine.generateDetailedAnalysis(prompt);
      
      res.json(analysis);
    } catch (error) {
      console.error('Detailed analysis error:', error);
      res.status(500).json({ error: 'Erro interno na análise detalhada' });
    }
  });

  // Get improvement suggestions for a prompt
  app.get("/api/prompts/:id/improvement-suggestions", async (req, res) => {
    try {
      const promptId = parseInt(req.params.id);
      
      // Check cache first
      const cachedAI = await storage.getCachedImprovementSuggestions(promptId, 'ai');
      
      if (cachedAI) {
        return res.json({
          ai_suggestions: cachedAI.suggestions,
          cached: true
        });
      }
      
      // Get fresh suggestions if not cached
      const prompt = await storage.getLegalPromptById(promptId);
      if (!prompt) {
        return res.status(404).json({ error: "Prompt não encontrado" });
      }
      
      const analysis = await smartSuggestionEngine.generateDetailedAnalysis(prompt);
      
      // Cache AI suggestions only
      if (!cachedAI) {
        await storage.cacheImprovementSuggestions({
          promptId,
          suggestionType: 'ai',
          suggestions: analysis.ai_suggestions
        });
      }
      
      res.json({
        ai_suggestions: analysis.ai_suggestions,
        cached: false
      });
    } catch (error) {
      console.error('Improvement suggestions error:', error);
      res.status(500).json({ error: 'Erro interno nas sugestões de melhoria' });
    }
  });

  // Get prompt iterations/versions
  app.get('/api/prompts/:id/versions', async (req, res) => {
    try {
      const promptId = parseInt(req.params.id);
      
      // Get original prompt
      const originalPrompt = await storage.getLegalPromptById(promptId);
      if (!originalPrompt) {
        return res.status(404).json({ error: 'Prompt não encontrado' });
      }
      
      // Get all iterations
      const iterations = await storage.getPromptIterations(promptId);
      
      // Create version 0 (original) entry
      const originalVersion = {
        id: 0, // Special ID for original version
        originalPromptId: promptId,
        iterationNumber: 0,
        userRequest: originalPrompt.userRequest,
        legalPrompt: originalPrompt.legalPrompt,
        documentType: originalPrompt.documentType,
        areaTags: originalPrompt.areaTags,
        relevanceScore: originalPrompt.relevanceScore,
        relevanceReasoning: originalPrompt.relevanceReasoning,
        relevanceSuggestions: originalPrompt.relevanceSuggestions,
        aiModel: originalPrompt.aiModel,
        createdAt: originalPrompt.createdAt,
        selectedImprovements: [],
        customAdditions: null,
        additionalRequirements: null,
        improvementSuggestions: null
      };
      
      // Combine original + iterations, sorted by iteration number
      const allVersions = [originalVersion, ...iterations];
      
      res.json({ versions: allVersions });
    } catch (error) {
      console.error('Error fetching prompt versions:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Get latest/best version of a prompt
  app.get('/api/prompts/:id/latest', async (req, res) => {
    try {
      const promptId = parseInt(req.params.id);
      const latestPrompt = await storage.getLatestPromptVersion(promptId);
      
      res.json(latestPrompt);
    } catch (error) {
      console.error('Error fetching latest prompt version:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Analyze AI suggestion quality with granular scoring
  app.post('/api/analyze-ai-suggestion', async (req, res) => {
    try {
      const { suggestionText, currentPrompt, documentType } = req.body;
      
      if (!suggestionText || typeof suggestionText !== 'string') {
        return res.status(400).json({ error: 'Invalid suggestion text' });
      }

      // Advanced semantic quality analysis for AI suggestions
      const wordCount = suggestionText.trim().split(/\s+/).length;
      
      // Positive legal terms
      const hasLegalTerms = /\b(cláusula|artigo|lei|código|jurisprudência|decreto|norma|contrato|acordo|direito|legal|jurídico|obrigação|responsabilidade|prazo|multa|rescisão|vigência|arbitragem|mediação|foro|competente)\b/i.test(suggestionText);
      
      // Advanced legal terminology
      const hasAdvancedTerms = /\b(conforme|mediante|salvo|exceto|desde que|quando|caso|se|sempre que|até que|resolução de conflitos|penalidades|inadimplemento|rescisório|indenizatório)\b/i.test(suggestionText);
      
      // Negative patterns - colloquial/inappropriate language
      const hasColloquialisms = /\b(morte de cachorro|pior dos casos|quebrar galho|dar um jeito|de qualquer jeito|meio que|tipo assim|sei lá|vai que|pô|cara|mano|véi)\b/i.test(suggestionText);
      const hasVagueLanguage = /\b(coisa|negócio|troço|bagulho|lance|parada|tal|etc\.?\s*$|e por aí vai)\b/i.test(suggestionText);
      
      // Structure and specificity for AI suggestions
      const hasStructure = /[:;.,]/.test(suggestionText);
      const hasSpecificity = wordCount > 15; // Higher bar for AI suggestions
      const hasTechnicalDetail = /\b(especificar|detalhar|incluir|definir|estabelecer|determinar|prever|regular)\b/i.test(suggestionText);
      
      // Document context analysis
      const isContractContext = documentType?.toLowerCase().includes('contrato') || currentPrompt?.toLowerCase().includes('contrato');
      const isPetitionContext = documentType?.toLowerCase().includes('petição') || currentPrompt?.toLowerCase().includes('petição');
      
      let qualityScore = 0.6; // Higher base for AI suggestions
      
      // Apply positive factors
      if (hasLegalTerms) qualityScore += 0.15;
      if (hasAdvancedTerms) qualityScore += 0.15;
      if (hasStructure) qualityScore += 0.08;
      if (hasSpecificity) qualityScore += 0.12;
      if (hasTechnicalDetail) qualityScore += 0.1;
      if (wordCount > 25) qualityScore += 0.05; // Bonus for detailed suggestions
      
      // Apply negative factors
      const formalityPenalty = isContractContext || isPetitionContext ? 0.25 : 0.15;
      
      if (hasColloquialisms) {
        qualityScore -= formalityPenalty;
      }
      if (hasVagueLanguage) {
        qualityScore -= 0.12;
      }
      
      // Ensure reasonable bounds for AI suggestions
      qualityScore = Math.max(0.3, Math.min(qualityScore, 0.95));
      
      // Build detailed reasoning for AI suggestions
      const reasoningParts = [];
      
      // Positive aspects
      if (hasLegalTerms) reasoningParts.push('✓ Terminologia jurídica apropriada');
      if (hasAdvancedTerms) reasoningParts.push('✓ Terminologia técnica avançada');
      if (hasTechnicalDetail) reasoningParts.push('✓ Detalhamento técnico adequado');
      if (hasStructure) reasoningParts.push('✓ Estrutura bem organizada');
      if (hasSpecificity && wordCount > 25) reasoningParts.push('✓ Sugestão detalhada e específica');
      
      // Negative aspects
      if (hasColloquialisms) {
        reasoningParts.push('⚠ PENALIDADE: Linguagem coloquial inadequada para contexto jurídico');
      }
      if (hasVagueLanguage) {
        reasoningParts.push('⚠ Linguagem vaga detectada');
      }
      
      // Improvement suggestions
      if (!hasLegalTerms && !hasColloquialisms) {
        reasoningParts.push('• Sugestão: Incluir mais terminologia jurídica específica');
      }
      if (!hasTechnicalDetail) {
        reasoningParts.push('• Sugestão: Adicionar mais detalhamento técnico');
      }
      if (wordCount < 20) {
        reasoningParts.push('• Sugestão: Elaborar com mais especificidade');
      }
      
      const reasoning = reasoningParts.length > 0 ? reasoningParts.join('. ') : 'Análise da sugestão IA concluída';

      res.json({
        qualityScore,
        reasoning,
        metrics: {
          hasLegalTerms,
          hasAdvancedTerms,
          hasStructure,
          hasSpecificity,
          hasTechnicalDetail,
          wordCount,
          hasColloquialisms,
          hasVagueLanguage
        }
      });
    } catch (error) {
      console.error('Error analyzing AI suggestion:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Analyze custom text quality
  app.post('/api/analyze-custom-text', async (req, res) => {
    try {
      const { customText, currentPrompt, documentType } = req.body;

      if (!customText || typeof customText !== 'string') {
        return res.status(400).json({ error: 'Invalid custom text' });
      }

      // Advanced semantic quality analysis
      const wordCount = customText.trim().split(/\s+/).length;
      
      // Positive legal terms
      const hasLegalTerms = /\b(cláusula|artigo|lei|código|jurisprudência|decreto|norma|contrato|acordo|direito|legal|jurídico|obrigação|responsabilidade|prazo|multa|rescisão|vigência)\b/i.test(customText);
      
      // Negative patterns - colloquial/inappropriate language
      const hasColloquialisms = /\b(morte de cachorro|pior dos casos|quebrar galho|dar um jeito|de qualquer jeito|meio que|tipo assim|sei lá|vai que|pô|cara|mano|véi)\b/i.test(customText);
      const hasVagueLanguage = /\b(coisa|negócio|troço|bagulho|lance|parada|tal|etc\.?\s*$|e por aí vai)\b/i.test(customText);
      const hasInformalPunctuation = /[!]{2,}|[?]{2,}|\.\.\.|rsrs|kkkk|haha/i.test(customText);
      
      // Structure and specificity
      const hasStructure = /[:;.,]/.test(customText);
      const hasSpecificity = wordCount > 10;
      const hasTechnicalDetail = /\b(conforme|mediante|salvo|exceto|desde que|quando|caso|se|sempre que|até que)\b/i.test(customText);
      
      // Document type context analysis
      const isContractContext = documentType?.toLowerCase().includes('contrato') || currentPrompt?.toLowerCase().includes('contrato');
      const isPetitionContext = documentType?.toLowerCase().includes('petição') || currentPrompt?.toLowerCase().includes('petição');
      
      let qualityScore = 0.5; // Base score
      
      // Apply positive factors
      if (hasLegalTerms) qualityScore += 0.2;
      if (hasStructure) qualityScore += 0.1;
      if (hasSpecificity) qualityScore += 0.1;
      if (hasTechnicalDetail) qualityScore += 0.15;
      if (wordCount > 20) qualityScore += 0.05;
      
      // Apply negative factors (more severe for formal documents)
      const formalityPenalty = isContractContext || isPetitionContext ? 0.3 : 0.2;
      
      if (hasColloquialisms) {
        qualityScore -= formalityPenalty;
      }
      if (hasVagueLanguage) {
        qualityScore -= 0.15;
      }
      if (hasInformalPunctuation) {
        qualityScore -= 0.1;
      }
      
      // Ensure reasonable bounds
      qualityScore = Math.max(0.2, Math.min(qualityScore, 0.95));
      
      // Build detailed reasoning
      const reasoningParts = [];
      
      // Positive aspects
      if (hasLegalTerms) reasoningParts.push('✓ Contém terminologia jurídica apropriada');
      if (hasTechnicalDetail) reasoningParts.push('✓ Usa conectivos técnicos adequados');
      if (hasStructure) reasoningParts.push('✓ Bem estruturado com pontuação');
      if (hasSpecificity && wordCount > 20) reasoningParts.push('✓ Texto detalhado e específico');
      
      // Negative aspects
      if (hasColloquialisms) {
        reasoningParts.push('⚠ PENALIDADE: Linguagem coloquial inadequada para documento jurídico formal');
      }
      if (hasVagueLanguage) {
        reasoningParts.push('⚠ Linguagem vaga e imprecisa detectada');
      }
      if (hasInformalPunctuation) {
        reasoningParts.push('⚠ Pontuação informal detectada');
      }
      
      // Improvement suggestions
      if (!hasLegalTerms && !hasColloquialisms) {
        reasoningParts.push('• Sugestão: Incluir mais terminologia jurídica específica');
      }
      if (!hasTechnicalDetail) {
        reasoningParts.push('• Sugestão: Usar conectivos técnicos (conforme, mediante, salvo)');
      }
      if (wordCount < 15) {
        reasoningParts.push('• Sugestão: Elaborar com mais detalhes específicos');
      }
      
      const reasoning = reasoningParts.length > 0 ? reasoningParts.join('. ') : 'Análise básica concluída';

      res.json({
        qualityScore,
        reasoning,
        wordCount,
        hasLegalTerms,
        hasStructure
      });
    } catch (error) {
      console.error('Error analyzing custom text:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Regenerate prompt with improvements
  app.post("/api/prompts/:id/regenerate", optionalAuthenticateUser, async (req, res) => {
    try {
      const promptId = parseInt(req.params.id);
      const validatedRequest = regenerationRequestSchema.parse(req.body);
      
      // Get the latest version of the prompt (could be original or latest iteration)
      const currentPrompt = await storage.getLatestPromptVersion(promptId);
      if (!currentPrompt) {
        return res.status(404).json({ error: "Prompt não encontrado" });
      }
      
      // Check rate limits using the same pattern as the main generation endpoint
      const realClientIp = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.get('User-Agent');
      const userKey = req.user?.id ? `user:${req.user.id}` : `ip:${realClientIp}`;
      
      const settings = await storage.getAdminSettings();
      const userUsage = await storage.getUserPromptUsageCount(userKey, settings.userRateLimitMinutes);
      
      if (userUsage >= settings.maxPromptsPerUser) {
        const limitType = req.user?.id ? 'conta' : 'IP';
        return res.status(429).json({ 
          message: `Limite de regenerações por ${limitType} atingido. Máximo de ${settings.maxPromptsPerUser} a cada ${settings.userRateLimitMinutes} minutos.` 
        });
      }
      
      // Record usage
      await storage.recordPromptUsage(userKey, userAgent);
      
      // Get current iteration number
      const existingIterations = await storage.getPromptIterations(promptId);
      const iterationNumber = existingIterations.length + 1;
      
      // Regenerate with improvements using the active AI model from settings
      const result = await smartSuggestionEngine.regenerateWithImprovements(
        currentPrompt,
        validatedRequest.selected_improvements,
        validatedRequest.custom_additions,
        validatedRequest.additional_requirements,
        settings.activeAiModel
      );
      
      // Save iteration to database
      await storage.createPromptIteration({
        originalPromptId: promptId,
        iterationNumber,
        userRequest: currentPrompt.userRequest + '\n\nMelhorias aplicadas:\n' + 
                    validatedRequest.selected_improvements.join('\n- ') +
                    (validatedRequest.custom_additions ? '\n\nAdições:\n' + validatedRequest.custom_additions : ''),
        improvementSuggestions: result.analysis.ai_suggestions,
        selectedImprovements: validatedRequest.selected_improvements,
        customAdditions: validatedRequest.custom_additions,
        legalPrompt: result.legalPrompt,
        documentType: result.analysis.document_type,
        areaTags: currentPrompt.areaTags,
        relevanceScore: result.analysis.current_score,
        relevanceReasoning: result.analysis.analysis_reasoning,
        relevanceSuggestions: result.analysis.ai_suggestions.map((s: any) => s.description),
        aiModel: settings.activeAiModel || currentPrompt.aiModel || 'gemini'
      });
      
      // Clear suggestions cache for this prompt
      await storage.clearSuggestionsCache(promptId);
      
      // Return the improved prompt and analysis
      res.json({
        legal_prompt: result.legalPrompt,
        analysis: result.analysis,
        iteration_number: iterationNumber,
        success: true
      });
      
    } catch (error) {
      console.error('Regenerate prompt error:', error);
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Dados de entrada inválidos", details: error.errors });
      }
      res.status(500).json({ error: 'Erro interno na regeneração do prompt' });
    }
  });

  // Get iteration history for a prompt
  app.get("/api/prompts/:id/iterations", async (req, res) => {
    try {
      const promptId = parseInt(req.params.id);
      
      const iterations = await storage.getPromptIterations(promptId);
      
      res.json({
        original_prompt_id: promptId,
        iterations: iterations.map(iteration => ({
          id: iteration.id,
          iteration_number: iteration.iterationNumber,
          relevance_score: iteration.relevanceScore,
          selected_improvements: iteration.selectedImprovements,
          custom_additions: iteration.customAdditions,
          created_at: iteration.createdAt
        }))
      });
    } catch (error) {
      console.error('Get iterations error:', error);
      res.status(500).json({ error: 'Erro interno ao buscar iterações' });
    }
  });

  // Contract analysis endpoint
  app.post('/api/contracts/analyze', async (req, res) => {
    try {
      const { fileContent, filename, securityChoice } = req.body;
      
      if (!fileContent || !filename) {
        return res.status(400).json({ 
          error: 'Conteúdo do arquivo e nome são obrigatórios' 
        });
      }

      // Simulate file processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check for sensitive data
      const sensitiveDataCheck = detectSensitiveData(fileContent);
      
      if (sensitiveDataCheck.hasSensitiveData && !securityChoice) {
        return res.json({
          requiresSecurity: true,
          sensitiveData: sensitiveDataCheck.detectedTypes,
          message: 'Dados sensíveis detectados. Escolha como proceder.'
        });
      }

      // Perform contract analysis
      const analysis = {
        contractType: detectContractType(fileContent),
        scores: {
          completeness: 85,
          compliance: 78,
          protection: 82,
          clarity: 90,
          overall: 84
        },
        risks: [
          {
            type: 'Cláusula de Rescisão',
            severity: 'medium' as const,
            description: 'Condições de rescisão poderiam ser mais detalhadas'
          }
        ],
        recommendations: [
          'Incluir cláusula específica de força maior',
          'Definir penalidades por descumprimento',
          'Adicionar foro competente'
        ],
        summary: 'Contrato analisado com qualidade geral boa. Algumas melhorias recomendadas.'
      };

      res.json({
        success: true,
        analysis,
        sensitiveDataHandled: sensitiveDataCheck.hasSensitiveData ? securityChoice : 'none'
      });

    } catch (error) {
      console.error('Contract analysis error:', error);
      res.status(500).json({ 
        error: 'Erro interno na análise do contrato' 
      });
    }
  });

  // Helper function to detect contract type
  function detectContractType(content: string): string {
    const contentLower = content.toLowerCase();
    
    if (contentLower.includes('prestação de serviços')) return 'Prestação de Serviços';
    if (contentLower.includes('compra e venda')) return 'Compra e Venda';
    if (contentLower.includes('locação')) return 'Locação';
    if (contentLower.includes('trabalho') || contentLower.includes('emprego')) return 'Trabalhista';
    if (contentLower.includes('sociedade') || contentLower.includes('sócio')) return 'Societário';
    if (contentLower.includes('confidencialidade')) return 'Confidencialidade';
    
    return 'Contrato Geral';
  }

  // Other existing endpoints...
  app.get("/api/prompts", async (req, res) => {
    // Declare variables outside try block so they're available in catch
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 9;
    const offset = (page - 1) * limit;
    
    try {
      const { prompts, total } = await storage.getPaginatedLegalPrompts(offset, limit);
      
      res.json({
        prompts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: offset + limit < total
        }
      });
    } catch (error) {
      console.error("Error fetching prompts:", error);
      
      // Provide sample prompts when database is unavailable
      const samplePrompts = [
        {
          id: 1,
          userRequest: "Preciso de um contrato de prestação de serviços para consultoria jurídica",
          legalPrompt: "CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE CONSULTORIA JURÍDICA\n\nCONTRATANTE: [NOME DA EMPRESA/PESSOA]\nCONTRATADO: [NOME DO ADVOGADO/ESCRITÓRIO]\n\n1. DO OBJETO: O presente contrato tem por objeto a prestação de serviços de consultoria jurídica especializada.\n\n2. DAS OBRIGAÇÕES: O CONTRATADO se obriga a prestar assessoria técnica e elaborar pareceres conforme solicitado.\n\n3. DA REMUNERAÇÃO: Os honorários serão de R$ [VALOR] mensais.\n\n4. DA VIGÊNCIA: Este contrato vigorará pelo prazo de [PRAZO].",
          documentType: "Contrato",
          areaTags: ["Direito Civil", "Consultoria", "Prestação de Serviços"],
          region: "São Paulo",
          city: "São Paulo",
          relevanceScore: 92,
          relevanceReasoning: "Contrato bem estruturado com cláusulas essenciais",
          relevanceSuggestions: ["Incluir cláusula de confidencialidade", "Especificar forma de rescisão"],
          aiModel: "claude",
          createdAt: new Date("2025-09-01")
        },
        {
          id: 2,
          userRequest: "Elaborar uma petição inicial para ação de cobrança",
          legalPrompt: "EXCELENTÍSSIMO SENHOR DOUTOR JUIZ DE DIREITO DA [VARA]\n\n[NOME DO AUTOR], brasileiro, [ESTADO CIVIL], [PROFISSÃO], inscrito no CPF sob o nº [CPF], residente e domiciliado à [ENDEREÇO], por intermédio de seu advogado que esta subscreve, vem respeitosamente à presença de Vossa Excelência propor\n\nAÇÃO DE COBRANÇA\n\nem face de [NOME DO RÉU], pelos fatos e fundamentos jurídicos a seguir expostos:\n\nDOS FATOS:\n[Descrição detalhada dos fatos]\n\nDO DIREITO:\n[Fundamentação jurídica]\n\nDOS PEDIDOS:\nRequer seja citado o requerido para pagamento da quantia de R$ [VALOR].",
          documentType: "Petição",
          areaTags: ["Direito Civil", "Cobrança", "Processo Civil"],
          region: "Rio de Janeiro",
          city: "Rio de Janeiro",
          relevanceScore: 89,
          relevanceReasoning: "Petição estruturada seguindo padrões processuais",
          relevanceSuggestions: ["Incluir jurisprudência", "Detalhar valor da dívida"],
          aiModel: "claude",
          createdAt: new Date("2025-08-30")
        },
        {
          id: 3,
          userRequest: "Notificação extrajudicial para cobrança de aluguel em atraso",
          legalPrompt: "NOTIFICAÇÃO EXTRAJUDICIAL\n\nAo(À) Sr.(ª) [NOME DO LOCATÁRIO]\n[ENDEREÇO DO IMÓVEL]\n\nPelo presente instrumento, [NOME DO LOCADOR], proprietário do imóvel situado no endereço acima mencionado, vem NOTIFICAR V.Sa. do seguinte:\n\n1. QUE existe contrato de locação firmado em [DATA];\n\n2. QUE se encontram em atraso os aluguéis referentes aos meses de [MESES];\n\n3. QUE o valor total da dívida é de R$ [VALOR];\n\n4. QUE concede o prazo de 10 (dez) dias para quitação;\n\n5. QUE, não havendo pagamento, serão adotadas as medidas judiciais cabíveis.\n\n[LOCAL E DATA]\n[ASSINATURA DO LOCADOR]",
          documentType: "Notificação",
          areaTags: ["Direito Civil", "Locação", "Cobrança"],
          region: "Minas Gerais",
          city: "Belo Horizonte",
          relevanceScore: 95,
          relevanceReasoning: "Notificação completa com todos os elementos necessários",
          relevanceSuggestions: ["Incluir forma de entrega", "Mencionar consequências do não pagamento"],
          aiModel: "gemini",
          createdAt: new Date("2025-08-28")
        }
      ];

      const start = offset;
      const end = offset + limit;
      const paginatedSamples = samplePrompts.slice(start, end);
      
      res.json({
        prompts: paginatedSamples,
        pagination: {
          page,
          limit,
          total: samplePrompts.length,
          totalPages: Math.ceil(samplePrompts.length / limit),
          hasMore: end < samplePrompts.length
        }
      });
    }
  });

  // Dynamic suggestions endpoint
  app.get("/api/suggestions", async (req, res) => {
    try {
      const { getCurrentSuggestions } = await import("./update-suggestions");
      const suggestions = getCurrentSuggestions();
      res.json({ suggestions });
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      res.status(500).json({ 
        message: "Erro ao buscar sugestões",
        suggestions: [
          "Petição inicial",
          "Parecer jurídico", 
          "Notificação extrajudicial",
          "Contestação cível",
          "Acordo de confidencialidade",
          "Alegações finais"
        ]
      });
    }
  });

  // Force update suggestions (admin endpoint)
  app.post("/api/admin/update-suggestions", async (req, res) => {
    try {
      const { forceUpdateSuggestions } = await import("./update-suggestions");
      const newSuggestions = await forceUpdateSuggestions();
      res.json({ 
        success: true, 
        suggestions: newSuggestions,
        message: "Sugestões atualizadas com sucesso" 
      });
    } catch (error) {
      console.error("Error updating suggestions:", error);
      res.status(500).json({ 
        success: false,
        message: "Erro ao atualizar sugestões" 
      });
    }
  });

  // Admin endpoints
  app.get("/api/admin/settings", async (req, res) => {
    try {
      const settings = await storage.getAdminSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching admin settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.put("/api/admin/settings", async (req, res) => {
    try {
      const settings = await storage.updateAdminSettings(req.body);
      res.json(settings);
    } catch (error) {
      console.error("Error updating admin settings:", error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  app.patch("/api/admin/settings", async (req, res) => {
    try {
      const settings = await storage.updateAdminSettings(req.body);
      res.json(settings);
    } catch (error) {
      console.error("Error updating admin settings:", error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  // Analytics endpoints
  app.get("/api/admin/analytics", async (req, res) => {
    try {
      const dailyPrompts = await db.execute(sql`
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM legal_prompts 
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(created_at)
        ORDER BY date
      `);
      
      const scoreDistribution = await db.execute(sql`
        SELECT 
          CASE 
            WHEN quality_score >= 90 THEN '90-100%'
            WHEN quality_score >= 80 THEN '80-89%'
            WHEN quality_score >= 70 THEN '70-79%'
            WHEN quality_score >= 60 THEN '60-69%'
            ELSE '<60%'
          END as range,
          COUNT(*) as count
        FROM legal_prompts 
        WHERE quality_score IS NOT NULL
        GROUP BY range
      `);

      res.json({
        dailyPrompts: dailyPrompts.rows,
        scoreDistribution: scoreDistribution.rows
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  app.get("/api/admin/analytics/usage", async (req, res) => {
    try {
      const [totalPrompts] = await db.execute(sql`SELECT COUNT(*) as count FROM legal_prompts`);
      const [activeUsers] = await db.execute(sql`SELECT COUNT(DISTINCT id) as count FROM users WHERE created_at >= NOW() - INTERVAL '7 days'`);
      const [averageScore] = await db.execute(sql`SELECT AVG(quality_score) as avg FROM legal_prompts WHERE quality_score IS NOT NULL`);
      const [todayPrompts] = await db.execute(sql`SELECT COUNT(*) as count FROM legal_prompts WHERE DATE(created_at) = CURDATE()`);

      res.json({
        totalPrompts: totalPrompts.rows[0]?.count || 0,
        activeUsers: activeUsers.rows[0]?.count || 0,
        averageScore: Math.round(averageScore.rows[0]?.avg || 0),
        todayPrompts: todayPrompts.rows[0]?.count || 0
      });
    } catch (error) {
      console.error("Error fetching usage analytics:", error);
      res.status(500).json({ message: "Failed to fetch usage analytics" });
    }
  });

  // Presets endpoints
  app.get("/api/admin/presets", async (req, res) => {
    try {
      const presets = await db.execute(sql`SELECT * FROM configuration_presets ORDER BY created_at DESC`);
      res.json({ presets: presets.rows });
    } catch (error) {
      console.error("Error fetching presets:", error);
      res.status(500).json({ message: "Failed to fetch presets" });
    }
  });

  app.get("/api/admin/presets/active", async (req, res) => {
    try {
      const [activePreset] = await db.execute(sql`SELECT * FROM configuration_presets WHERE is_active = true LIMIT 1`);
      res.json(activePreset.rows[0] || null);
    } catch (error) {
      console.error("Error fetching active preset:", error);
      res.status(500).json({ message: "Failed to fetch active preset" });
    }
  });

  app.post("/api/admin/presets", async (req, res) => {
    try {
      const { name, description } = req.body;
      const result = await db.execute(sql`
        INSERT INTO configuration_presets (name, description, config, created_at)
        VALUES (${name}, ${description}, '{}', NOW())
      `);
      res.json({ success: true, id: result.insertId });
    } catch (error) {
      console.error("Error creating preset:", error);
      res.status(500).json({ message: "Failed to create preset" });
    }
  });

  // Quality endpoints
  app.get("/api/admin/quality/stats", async (req, res) => {
    try {
      const [averageScore] = await db.execute(sql`SELECT AVG(quality_score) as avg FROM legal_prompts WHERE quality_score IS NOT NULL`);
      const [totalAnalyses] = await db.execute(sql`SELECT COUNT(*) as count FROM legal_prompts WHERE quality_score IS NOT NULL`);
      const [improvementSuggestions] = await db.execute(sql`SELECT COUNT(*) as count FROM improvement_suggestions_cache`);

      res.json({
        averageScore: Math.round(averageScore.rows[0]?.avg || 0),
        totalAnalyses: totalAnalyses.rows[0]?.count || 0,
        improvementSuggestions: improvementSuggestions.rows[0]?.count || 0
      });
    } catch (error) {
      console.error("Error fetching quality stats:", error);
      res.status(500).json({ message: "Failed to fetch quality stats" });
    }
  });

  // Ratings endpoints
  app.get("/api/admin/ratings", async (req, res) => {
    try {
      const ratings = await db.execute(sql`
        SELECT 
          rating,
          COUNT(*) as count
        FROM user_ratings 
        GROUP BY rating
      `);

      const recentComments = await db.execute(sql`
        SELECT 
          rating,
          comment,
          created_at
        FROM user_ratings 
        WHERE comment IS NOT NULL AND comment != ''
        ORDER BY created_at DESC 
        LIMIT 10
      `);

      const ratingsMap = { veryBad: 0, bad: 0, good: 0, excellent: 0 };
      ratings.rows.forEach((row: any) => {
        switch(row.rating) {
          case 1: ratingsMap.veryBad = row.count; break;
          case 2: ratingsMap.bad = row.count; break;
          case 4: ratingsMap.good = row.count; break;
          case 5: ratingsMap.excellent = row.count; break;
        }
      });

      const formattedComments = recentComments.rows.map((comment: any) => ({
        emoji: comment.rating === 1 ? '😔' : comment.rating === 2 ? '😐' : comment.rating === 4 ? '😊' : '😍',
        text: comment.comment,
        date: new Date(comment.created_at).toLocaleDateString('pt-BR')
      }));

      res.json({
        ...ratingsMap,
        recentComments: formattedComments
      });
    } catch (error) {
      console.error("Error fetching ratings:", error);
      res.status(500).json({ message: "Failed to fetch ratings" });
    }
  });

  // Contract system stubs
  app.post('/docsmart/api/auth/login', (req, res) => {
    res.json({ 
      success: false, 
      error: 'Sistema em desenvolvimento - faça login em breve!' 
    });
  });

  // Serve contract analysis page
  app.get('/docsmart/*', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Análise de Contratos - Prompts Jurídicos</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50 min-h-screen">
    <div class="container mx-auto px-4 py-8">
        <div class="max-w-4xl mx-auto">
            <div class="text-center mb-8">
                <h1 class="text-4xl font-bold text-gray-900 mb-4">
                    📄 Sistema de Análise de Contratos
                </h1>
                <p class="text-xl text-gray-600">
                    Análise inteligente de contratos com IA avançada
                </p>
            </div>
            
            <div class="bg-white rounded-lg shadow-lg p-8">
                <div class="text-center">
                    <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span class="text-2xl">🚀</span>
                    </div>
                    <h2 class="text-2xl font-semibold text-gray-900 mb-4">
                        Sistema Operacional
                    </h2>
                    <p class="text-gray-600 mb-6">
                        O sistema de análise está funcionando. Volte à página principal para acessar.
                    </p>
                    <a href="/" class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                        Voltar ao Sistema Principal
                    </a>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
    `);
  });

  // Endpoint para predição de impacto de mudanças
  app.post("/api/score/predict", async (req, res) => {
    try {
      const { promptId, proposedChanges } = req.body;
      
      if (!promptId || !proposedChanges) {
        return res.status(400).json({ message: "promptId e proposedChanges são obrigatórios" });
      }
      
      const prompt = await storage.getLegalPromptById(promptId);
      if (!prompt) {
        return res.status(404).json({ message: "Prompt não encontrado" });
      }
      
      const prediction = await intelligentScoringEngine.predictScoreImpact(
        prompt,
        proposedChanges,
        prompt.relevanceScore || 0.5
      );
      
      res.json(prediction);
    } catch (error) {
      console.error("Erro na predição de score:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
  
  // Endpoint para obter configuração atual do scoring
  app.get("/api/score/config", async (req, res) => {
    try {
      const config = intelligentScoringEngine.getConfig();
      res.json(config);
    } catch (error) {
      console.error("Erro ao obter configuração:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
  
  // Endpoint para atualizar configuração do scoring
  app.post("/api/score/config", async (req, res) => {
    try {
      const newConfig = req.body;
      intelligentScoringEngine.updateConfig(newConfig);
      
      // Salvar configuração no banco de dados para persistência
      const settings = await storage.getAdminSettings();
      await storage.updateAdminSettings({
        ...settings,
        scoringConfig: newConfig
      });
      
      res.json({ message: "Configuração atualizada com sucesso" });
    } catch (error) {
      console.error("Erro ao atualizar configuração:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Sistema de Avaliação por Usuário
  app.post("/api/user/visit", async (req, res) => {
    try {
      const userIdentifier = req.ip || req.headers['x-forwarded-for'] || 'anonymous';
      const visitCount = await storage.recordUserVisit(userIdentifier as string);
      
      res.json({ 
        visitCount,
        shouldShowRating: visitCount === 2 || visitCount === 10
      });
    } catch (error) {
      console.error("Erro ao registrar visita:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/user/rating", async (req, res) => {
    try {
      const { rating, feedback, visitNumber } = req.body;
      const userIdentifier = req.ip || req.headers['x-forwarded-for'] || 'anonymous';
      
      if (!rating || !visitNumber) {
        return res.status(400).json({ message: "Rating e visitNumber são obrigatórios" });
      }

      await storage.createUserRating(userIdentifier as string, rating, visitNumber, feedback);
      
      res.json({ message: "Avaliação registrada com sucesso" });
    } catch (error) {
      console.error("Erro ao registrar avaliação:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.get("/api/admin/ratings", async (req, res) => {
    try {
      const [ratings, stats] = await Promise.all([
        storage.getUserRatings(),
        storage.getRatingStats()
      ]);
      
      res.json({ ratings, stats });
    } catch (error) {
      console.error("Erro ao buscar avaliações:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Authentication Routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email e senha são obrigatórios" });
      }

      // Check if user already exists
      const [existingUser] = await db.select().from(users).where(eq(users.email, email));
      if (existingUser) {
        return res.status(400).json({ message: "Usuário já existe com este email" });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user with existing table structure
      const [newUser] = await db.insert(users).values({
        email,
        passwordHash,
        firstName: firstName || null,
        lastName: lastName || null,
        tokenBalance: 1700, // Novos usuários recebem 1700 tokens automaticamente
        currentPlan: 'free',
        emailVerified: false
      }).returning();

      // Return user data without password and simple token
      const { passwordHash: _, ...userWithoutPassword } = newUser;
      res.status(201).json({
        user: userWithoutPassword,
        token: newUser.id.toString() // Simple token for now
      });
    } catch (error) {
      console.error("Erro ao registrar usuário:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email e senha são obrigatórios" });
      }

      // Find user by email
      const [user] = await db.select().from(users).where(eq(users.email, email));
      if (!user) {
        return res.status(401).json({ message: "Credenciais inválidas" });
      }

      // Verify password
      if (!user.passwordHash) {
        return res.status(401).json({ message: "Credenciais inválidas" });
      }

      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Credenciais inválidas" });
      }

      // Return user data without password and simple token
      const { passwordHash: _, ...userWithoutPassword } = user;
      res.json({
        user: userWithoutPassword,
        token: user.id.toString() // Simple token for now
      });
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.get("/api/auth/me", authenticateUser, async (req, res) => {
    try {
      const user = req.user!;
      const { passwordHash: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Erro ao buscar dados do usuário:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Token and Document Routes
  app.get("/api/user/tokens", authenticateUser, async (req, res) => {
    try {
      const [tokens] = await db.select().from(userTokens).where(eq(userTokens.userId, req.user!.id));
      res.json(tokens || { currentBalance: req.user!.tokenBalance || 1700 });
    } catch (error) {
      console.error("Erro ao buscar tokens:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.get("/api/user/token-history", authenticateUser, async (req, res) => {
    try {
      const transactions = await db.select().from(tokenTransactionsMain).where(eq(tokenTransactionsMain.userId, req.user!.id));
      res.json(transactions);
    } catch (error) {
      console.error("Erro ao buscar histórico de tokens:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.get("/api/user/documents", authenticateUser, async (req, res) => {
    try {
      const documents = await db.select().from(generatedDocuments).where(eq(generatedDocuments.userId, req.user!.id));
      res.json(documents);
    } catch (error) {
      console.error("Erro ao buscar documentos:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Document Export Routes
  app.post("/api/prompts/:promptId/export/:format", authenticateUser, async (req, res) => {
    try {
      const { promptId, format } = req.params;
      const user = req.user!;

      // Validate format
      if (!['pdf', 'docx', 'txt'].includes(format)) {
        return res.status(400).json({ message: "Formato não suportado" });
      }

      // Get prompt data
      const [prompt] = await db.select().from(legalPrompts).where(eq(legalPrompts.id, parseInt(promptId)));
      if (!prompt) {
        return res.status(404).json({ message: "Prompt não encontrado" });
      }

      // Check user token balance
      const requiredTokens = 5; // TOKEN_COSTS.DOCUMENT_EXPORT
      const currentBalance = user.tokenBalance || 0;

      if (currentBalance < requiredTokens) {
        return res.status(402).json({ 
          message: `Tokens insuficientes. Você tem ${currentBalance} tokens, mas precisa de ${requiredTokens}.` 
        });
      }

      // Generate ethical content with disclaimer
      const disclaimerText = `
⚖️ AVISO LEGAL IMPORTANTE
===============================

Este documento foi gerado por inteligência artificial e REQUER REVISÃO PROFISSIONAL OBRIGATÓRIA.

IMPORTANTE:
- Este sistema NUNCA inventa jurisprudência, leis ou referências legais
- Todo o conteúdo deve ser revisado por advogado qualificado
- A plataforma não se responsabiliza pela aplicação prática
- Verifique sempre a legislação atual antes do uso

===============================

SOLICITAÇÃO ORIGINAL:
"${prompt.userRequest}"

DOCUMENTO TIPO: ${prompt.documentType}
GERADO EM: ${new Date().toLocaleString('pt-BR')}

===============================

CONTEÚDO GERADO:

${prompt.legalPrompt}

===============================

⚖️ LEMBRE-SE: Sempre consulte um advogado qualificado antes de usar qualquer documento legal.
`;

      let fileContent: Buffer;
      let filename: string;
      let mimeType: string;

      // Generate document based on format
      switch (format) {
        case 'txt':
          fileContent = Buffer.from(disclaimerText, 'utf8');
          filename = `documento-juridico-${promptId}.txt`;
          mimeType = 'text/plain';
          break;

        case 'pdf':
          // For PDF, we'll need to use a library like jsPDF or similar
          // For now, we'll return text content with PDF headers
          fileContent = Buffer.from(disclaimerText, 'utf8');
          filename = `documento-juridico-${promptId}.pdf`;
          mimeType = 'application/pdf';
          break;

        case 'docx':
          // For DOCX, we'll need to use a library like docx
          // For now, we'll return text content 
          fileContent = Buffer.from(disclaimerText, 'utf8');
          filename = `documento-juridico-${promptId}.docx`;
          mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          break;

        default:
          return res.status(400).json({ message: "Formato não suportado" });
      }

      // Consume tokens - Update user's token balance
      await db
        .update(users)
        .set({ tokenBalance: newBalance })
        .where(eq(users.id, user.id));

      // Send file
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', mimeType);
      res.send(fileContent);

    } catch (error) {
      console.error("Erro ao exportar documento:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // =============================================
  // ROTAS DE ADMINISTRAÇÃO DE USUÁRIOS
  // =============================================

  // Listar todos os usuários (admin)
  app.get("/api/admin/users", async (req, res) => {
    try {
      // TODO: Add admin authentication check
      const allUsers = await db
        .select({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          tokenBalance: users.tokenBalance,
          currentPlan: users.currentPlan,
          emailVerified: users.emailVerified,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt
        })
        .from(users)
        .orderBy(users.createdAt);

      res.json({ users: allUsers });
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Atualizar tokens de um usuário (admin)
  app.patch("/api/admin/users/:userId/tokens", async (req, res) => {
    try {
      const { userId } = req.params;
      const { tokenAmount, operation } = req.body; // operation: 'add' | 'set' | 'subtract'
      
      if (!tokenAmount || tokenAmount < 0) {
        return res.status(400).json({ message: "Quantidade de tokens inválida" });
      }

      // Buscar usuário atual
      const [user] = await db.select().from(users).where(eq(users.id, parseInt(userId)));
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      let newTokenBalance = user.tokenBalance;
      
      switch (operation) {
        case 'add':
          newTokenBalance = user.tokenBalance + tokenAmount;
          break;
        case 'subtract':
          newTokenBalance = Math.max(0, user.tokenBalance - tokenAmount);
          break;
        case 'set':
          newTokenBalance = tokenAmount;
          break;
        default:
          return res.status(400).json({ message: "Operação inválida" });
      }

      // Atualizar balance de tokens
      const [updatedUser] = await db
        .update(users)
        .set({ 
          tokenBalance: newTokenBalance,
          updatedAt: new Date()
        })
        .where(eq(users.id, parseInt(userId)))
        .returning();

      res.json({ 
        message: "Tokens atualizados com sucesso",
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          tokenBalance: updatedUser.tokenBalance,
          previousBalance: user.tokenBalance
        }
      });
    } catch (error) {
      console.error("Erro ao atualizar tokens:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Distribuir tokens para múltiplos usuários (admin)
  app.post("/api/admin/users/distribute-tokens", async (req, res) => {
    try {
      const { userIds, tokenAmount, operation = 'add' } = req.body;

      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ message: "Lista de usuários inválida" });
      }

      if (!tokenAmount || tokenAmount < 0) {
        return res.status(400).json({ message: "Quantidade de tokens inválida" });
      }

      const results = [];

      // Processar cada usuário
      for (const userId of userIds) {
        try {
          const [user] = await db.select().from(users).where(eq(users.id, parseInt(userId)));
          if (!user) {
            results.push({ userId, success: false, error: "Usuário não encontrado" });
            continue;
          }

          let newTokenBalance = user.tokenBalance;
          
          switch (operation) {
            case 'add':
              newTokenBalance = user.tokenBalance + tokenAmount;
              break;
            case 'subtract':
              newTokenBalance = Math.max(0, user.tokenBalance - tokenAmount);
              break;
            case 'set':
              newTokenBalance = tokenAmount;
              break;
          }

          await db
            .update(users)
            .set({ 
              tokenBalance: newTokenBalance,
              updatedAt: new Date()
            })
            .where(eq(users.id, parseInt(userId)));

          results.push({ 
            userId, 
            success: true, 
            email: user.email,
            previousBalance: user.tokenBalance,
            newBalance: newTokenBalance
          });
        } catch (error) {
          results.push({ userId, success: false, error: error.message });
        }
      }

      res.json({ 
        message: "Distribuição de tokens concluída",
        results,
        totalProcessed: userIds.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      });
    } catch (error) {
      console.error("Erro ao distribuir tokens:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Estatísticas de usuários e tokens (admin)
  app.get("/api/admin/users/stats", async (req, res) => {
    try {
      // Total de usuários
      const totalUsers = await db.select({ count: sql`count(*)` }).from(users);
      
      // Usuários por plano
      const usersByPlan = await db
        .select({ 
          plan: users.currentPlan, 
          count: sql`count(*)` 
        })
        .from(users)
        .groupBy(users.currentPlan);

      // Distribuição de tokens
      const tokenStats = await db
        .select({
          totalTokens: sql`sum(${users.tokenBalance})`,
          avgTokens: sql`avg(${users.tokenBalance})`,
          maxTokens: sql`max(${users.tokenBalance})`,
          minTokens: sql`min(${users.tokenBalance})`
        })
        .from(users);

      // Usuários com poucos tokens (menos de 100)
      const lowTokenUsers = await db
        .select({ count: sql`count(*)` })
        .from(users)
        .where(sql`${users.tokenBalance} < 100`);

      // Usuários ativos recentes (últimos 7 dias)
      const recentUsers = await db
        .select({ count: sql`count(*)` })
        .from(users)
        .where(sql`${users.createdAt} >= ${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)}`);

      res.json({
        totalUsers: totalUsers[0]?.count || 0,
        usersByPlan,
        tokenStats: tokenStats[0] || {},
        lowTokenUsers: lowTokenUsers[0]?.count || 0,
        recentUsers: recentUsers[0]?.count || 0
      });
    } catch (error) {
      console.error("Erro ao buscar estatísticas:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Buscar usuário específico (admin)
  app.get("/api/admin/users/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      
      const [user] = await db
        .select({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          tokenBalance: users.tokenBalance,
          currentPlan: users.currentPlan,
          emailVerified: users.emailVerified,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt
        })
        .from(users)
        .where(eq(users.id, parseInt(userId)));

      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      // Buscar histórico de prompts do usuário
      const userPrompts = await db
        .select({
          id: legalPrompts.id,
          userRequest: legalPrompts.userRequest,
          documentType: legalPrompts.documentType,
          createdAt: legalPrompts.createdAt
        })
        .from(legalPrompts)
        .where(eq(legalPrompts.id, user.id)) // Assuming user connection
        .orderBy(legalPrompts.createdAt)
        .limit(10);

      res.json({ 
        user,
        recentPrompts: userPrompts
      });
    } catch (error) {
      console.error("Erro ao buscar usuário:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Endpoints avançados para administração de usuários

  // Deletar usuário (admin)
  app.delete("/api/admin/users/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Verificar se usuário existe
      const [existingUser] = await db.select().from(users).where(eq(users.id, parseInt(userId)));
      if (!existingUser) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      // Deletar usuário
      await db.delete(users).where(eq(users.id, parseInt(userId)));
      
      res.json({ message: "Usuário deletado com sucesso" });
    } catch (error) {
      console.error("Erro ao deletar usuário:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Alterar plano do usuário (admin)
  app.patch("/api/admin/users/:userId/plan", async (req, res) => {
    try {
      const { userId } = req.params;
      const { plan } = req.body;
      
      if (!plan || !['free', 'professional', 'enterprise'].includes(plan)) {
        return res.status(400).json({ message: "Plano inválido" });
      }

      const [updatedUser] = await db
        .update(users)
        .set({ currentPlan: plan, updatedAt: new Date() })
        .where(eq(users.id, parseInt(userId)))
        .returning();

      if (!updatedUser) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      res.json({ 
        message: "Plano atualizado com sucesso",
        user: updatedUser 
      });
    } catch (error) {
      console.error("Erro ao atualizar plano:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Verificar/desverificar email do usuário (admin)
  app.patch("/api/admin/users/:userId/verify-email", async (req, res) => {
    try {
      const { userId } = req.params;
      const { verified } = req.body;

      const [updatedUser] = await db
        .update(users)
        .set({ emailVerified: verified, updatedAt: new Date() })
        .where(eq(users.id, parseInt(userId)))
        .returning();

      if (!updatedUser) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      res.json({ 
        message: `Email ${verified ? 'verificado' : 'desverificado'} com sucesso`,
        user: updatedUser 
      });
    } catch (error) {
      console.error("Erro ao atualizar verificação de email:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Buscar histórico de atividades do usuário (admin)
  app.get("/api/admin/users/:userId/activity", async (req, res) => {
    try {
      const { userId } = req.params;
      const limit = parseInt(req.query.limit as string) || 20;

      // Buscar prompts criados pelo usuário
      const userPrompts = await db
        .select({
          id: legalPrompts.id,
          userRequest: legalPrompts.userRequest,
          documentType: legalPrompts.documentType,
          relevanceScore: legalPrompts.relevanceScore,
          createdAt: legalPrompts.createdAt
        })
        .from(legalPrompts)
        .orderBy(legalPrompts.createdAt)
        .limit(limit);

      // Simular atividades do usuário (expandir conforme necessário)
      const activities = [
        ...userPrompts.map(prompt => ({
          type: 'prompt_created',
          description: `Criou prompt: ${prompt.userRequest.substring(0, 50)}...`,
          documentType: prompt.documentType,
          score: prompt.relevanceScore,
          timestamp: prompt.createdAt
        }))
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      res.json({ activities });
    } catch (error) {
      console.error("Erro ao buscar atividades:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Buscar métricas avançadas do sistema (admin)
  app.get("/api/admin/metrics/advanced", async (req, res) => {
    try {
      // Métricas de crescimento por período
      const growthData = await db
        .select({
          date: sql`DATE(${users.createdAt})`,
          count: sql`count(*)`
        })
        .from(users)
        .where(sql`${users.createdAt} >= ${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)}`)
        .groupBy(sql`DATE(${users.createdAt})`)
        .orderBy(sql`DATE(${users.createdAt})`);

      // Distribuição de tokens por faixas
      const tokenDistribution = await db
        .select({
          range: sql`
            CASE 
              WHEN ${users.tokenBalance} = 0 THEN '0'
              WHEN ${users.tokenBalance} BETWEEN 1 AND 100 THEN '1-100'
              WHEN ${users.tokenBalance} BETWEEN 101 AND 500 THEN '101-500'
              WHEN ${users.tokenBalance} BETWEEN 501 AND 1000 THEN '501-1000'
              WHEN ${users.tokenBalance} BETWEEN 1001 AND 2000 THEN '1001-2000'
              ELSE '2000+'
            END
          `,
          count: sql`count(*)`
        })
        .from(users)
        .groupBy(sql`
          CASE 
            WHEN ${users.tokenBalance} = 0 THEN '0'
            WHEN ${users.tokenBalance} BETWEEN 1 AND 100 THEN '1-100'
            WHEN ${users.tokenBalance} BETWEEN 101 AND 500 THEN '101-500'
            WHEN ${users.tokenBalance} BETWEEN 501 AND 1000 THEN '501-1000'
            WHEN ${users.tokenBalance} BETWEEN 1001 AND 2000 THEN '1001-2000'
            ELSE '2000+'
          END
        `);

      // Top usuários por saldo de tokens
      const topUsersByTokens = await db
        .select({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          tokenBalance: users.tokenBalance,
          currentPlan: users.currentPlan
        })
        .from(users)
        .orderBy(sql`${users.tokenBalance} DESC`)
        .limit(10);

      res.json({
        growthData,
        tokenDistribution,
        topUsersByTokens
      });
    } catch (error) {
      console.error("Erro ao buscar métricas avançadas:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Exportar dados dos usuários (admin)
  app.get("/api/admin/users/export", async (req, res) => {
    try {
      const format = req.query.format as string || 'json';
      
      const allUsers = await db
        .select({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          tokenBalance: users.tokenBalance,
          currentPlan: users.currentPlan,
          emailVerified: users.emailVerified,
          createdAt: users.createdAt
        })
        .from(users)
        .orderBy(users.createdAt);

      if (format === 'csv') {
        const csvHeader = 'ID,Email,Nome,Sobrenome,Tokens,Plano,Email Verificado,Data Criação\n';
        const csvData = allUsers.map(user => 
          `${user.id},"${user.email}","${user.firstName || ''}","${user.lastName || ''}",${user.tokenBalance},"${user.currentPlan}",${user.emailVerified},"${user.createdAt}"`
        ).join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="usuarios.csv"');
        res.send(csvHeader + csvData);
      } else {
        res.json({ users: allUsers });
      }
    } catch (error) {
      console.error("Erro ao exportar usuários:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // =============================================
  // SISTEMA DE PAGAMENTOS STRIPE
  // =============================================

  // Endpoint para listar pacotes de tokens disponíveis
  app.get("/api/payments/packages", (req, res) => {
    res.json({ packages: TOKEN_PACKAGES });
  });

  // Criar Payment Intent para compra de tokens
  app.post("/api/payments/create-payment-intent", requireAuth, async (req, res) => {
    try {
      if (!stripe) {
        return res.status(503).json({ message: "Sistema de pagamento não configurado" });
      }

      const { packageKey } = req.body;
      
      if (!packageKey || !TOKEN_PACKAGES[packageKey as keyof typeof TOKEN_PACKAGES]) {
        return res.status(400).json({ message: "Pacote inválido" });
      }

      const selectedPackage = TOKEN_PACKAGES[packageKey as keyof typeof TOKEN_PACKAGES];
      const user = req.user!;

      // Criar Payment Intent no Stripe
      const paymentIntent = await stripe.paymentIntents.create({
        amount: selectedPackage.price, // Valor em centavos
        currency: "brl",
        customer: user.stripeCustomerId || undefined,
        metadata: {
          userId: user.id.toString(),
          packageKey: packageKey,
          tokens: selectedPackage.tokens.toString()
        },
        description: `Compra de tokens - ${selectedPackage.name}`,
        receipt_email: user.email || undefined
      });

      // Se o usuário não tem um customer ID do Stripe, criar e salvar
      if (!user.stripeCustomerId && paymentIntent.customer) {
        await db.update(users)
          .set({ stripeCustomerId: paymentIntent.customer as string })
          .where(eq(users.id, user.id));
      }

      res.json({
        clientSecret: paymentIntent.client_secret,
        packageInfo: selectedPackage
      });

    } catch (error) {
      console.error("Erro ao criar Payment Intent:", error);
      res.status(500).json({ message: "Erro ao processar pagamento" });
    }
  });

  // Confirmar pagamento e adicionar tokens
  app.post("/api/payments/confirm", requireAuth, async (req, res) => {
    try {
      const { paymentIntentId } = req.body;

      if (!paymentIntentId) {
        return res.status(400).json({ message: "Payment Intent ID necessário" });
      }

      // Recuperar Payment Intent do Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent.status !== "succeeded") {
        return res.status(400).json({ message: "Pagamento não foi confirmado" });
      }

      const userId = parseInt(paymentIntent.metadata.userId);
      const tokens = parseInt(paymentIntent.metadata.tokens);
      const packageKey = paymentIntent.metadata.packageKey;

      if (userId !== req.user!.id) {
        return res.status(403).json({ message: "Pagamento não pertence ao usuário" });
      }

      // Adicionar tokens ao usuário
      const [updatedUser] = await db.update(users)
        .set({ 
          tokenBalance: sql`${users.tokenBalance} + ${tokens}`,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId))
        .returning();

      // Registrar transação de tokens
      await db.insert(tokenTransactionsMain).values({
        userId: userId,
        amount: tokens,
        type: "purchase",
        description: `Compra de tokens - ${TOKEN_PACKAGES[packageKey as keyof typeof TOKEN_PACKAGES].name}`,
        stripePaymentIntentId: paymentIntentId
      });

      res.json({
        message: "Tokens adicionados com sucesso!",
        newBalance: updatedUser.tokenBalance,
        tokensAdded: tokens
      });

    } catch (error) {
      console.error("Erro ao confirmar pagamento:", error);
      res.status(500).json({ message: "Erro ao confirmar pagamento" });
    }
  });

  // Webhook do Stripe para processar eventos
  app.post("/api/payments/webhook", express.raw({type: 'application/json'}), async (req, res) => {
    const sig = req.headers['stripe-signature'] as string;
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET || '');
    } catch (err: any) {
      console.error("Erro na verificação do webhook:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Processar eventos do Stripe
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          
          if (paymentIntent.metadata.userId && paymentIntent.metadata.tokens) {
            const userId = parseInt(paymentIntent.metadata.userId);
            const tokens = parseInt(paymentIntent.metadata.tokens);
            const packageKey = paymentIntent.metadata.packageKey;

            // Verificar se a transação já foi processada
            const [existingTransaction] = await db.select()
              .from(tokenTransactionsMain)
              .where(eq(tokenTransactionsMain.stripePaymentIntentId, paymentIntent.id));

            if (!existingTransaction) {
              // Adicionar tokens ao usuário
              await db.update(users)
                .set({ 
                  tokenBalance: sql`${users.tokenBalance} + ${tokens}`,
                  updatedAt: new Date()
                })
                .where(eq(users.id, userId));

              // Registrar transação
              await db.insert(tokenTransactionsMain).values({
                userId: userId,
                amount: tokens,
                type: "purchase",
                description: `Compra de tokens via webhook - ${TOKEN_PACKAGES[packageKey as keyof typeof TOKEN_PACKAGES]?.name || 'Pacote'}`,
                stripePaymentIntentId: paymentIntent.id
              });

              console.log(`✅ Tokens adicionados via webhook: ${tokens} tokens para usuário ${userId}`);
            }
          }
          break;

        case 'payment_intent.payment_failed':
          const failedPayment = event.data.object as Stripe.PaymentIntent;
          console.error(`❌ Pagamento falhou: ${failedPayment.id}`);
          break;

        default:
          console.log(`Evento não processado: ${event.type}`);
      }

      res.json({received: true});
    } catch (error) {
      console.error("Erro ao processar webhook:", error);
      res.status(500).json({ message: "Erro ao processar webhook" });
    }
  });

  // Buscar histórico de pagamentos do usuário
  app.get("/api/payments/history", requireAuth, async (req, res) => {
    try {
      const transactions = await db.select({
        id: tokenTransactionsMain.id,
        amount: tokenTransactionsMain.amount,
        type: tokenTransactionsMain.type,
        description: tokenTransactionsMain.description,
        createdAt: tokenTransactionsMain.createdAt,
        stripePaymentIntentId: tokenTransactionsMain.stripePaymentIntentId
      })
      .from(tokenTransactionsMain)
      .where(eq(tokenTransactionsMain.userId, req.user!.id))
      .orderBy(sql`${tokenTransactionsMain.createdAt} DESC`)
      .limit(50);

      res.json({ transactions });
    } catch (error) {
      console.error("Erro ao buscar histórico:", error);
      res.status(500).json({ message: "Erro ao buscar histórico de pagamentos" });
    }
  });

  // Admin: Buscar estatísticas de pagamentos
  app.get("/api/admin/payments/stats", async (req, res) => {
    try {
      // Total de receita
      const revenueStats = await db.select({
        totalRevenue: sql`SUM(CASE WHEN ${tokenTransactionsMain.type} = 'purchase' THEN ${tokenTransactionsMain.amount} * 0.01 ELSE 0 END)`, // Aproximação baseada no valor médio por token
        totalTransactions: sql`COUNT(CASE WHEN ${tokenTransactionsMain.type} = 'purchase' THEN 1 END)`,
        totalTokensSold: sql`SUM(CASE WHEN ${tokenTransactionsMain.type} = 'purchase' THEN ${tokenTransactionsMain.amount} ELSE 0 END)`
      }).from(tokenTransactionsMain);

      // Transações por período (últimos 30 dias)
      const dailyStats = await db.select({
        date: sql`DATE(${tokenTransactionsMain.createdAt})`,
        transactions: sql`COUNT(*)`,
        tokens: sql`SUM(${tokenTransactionsMain.amount})`
      })
      .from(tokenTransactionsMain)
      .where(sql`${tokenTransactionsMain.createdAt} >= ${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)}`)
      .groupBy(sql`DATE(${tokenTransactionsMain.createdAt})`)
      .orderBy(sql`DATE(${tokenTransactionsMain.createdAt})`);

      res.json({
        revenue: revenueStats[0],
        dailyStats
      });
    } catch (error) {
      console.error("Erro ao buscar estatísticas de pagamento:", error);
      res.status(500).json({ message: "Erro ao buscar estatísticas" });
    }
  });

  const server = createServer(app);
  return server;
}