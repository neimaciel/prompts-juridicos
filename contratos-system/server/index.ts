import express from 'express';
import session from 'express-session';
import { createServer } from 'http';
import path from 'path';
import './types'; // Import session types
import { contractStorage } from './storage';
import { DocumentParser } from './document-parser';
import { AdvancedSensitiveDataDetector } from './sensitive-data-detector';
import { NativeContractCrypto } from './crypto-engine';
import { ContractAnalysisEngine } from './contract-analyzer';
import { stripeService, SUBSCRIPTION_PLANS } from './stripe-service';

const app = express();
const httpServer = createServer(app);

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'contract-analysis-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// CORS for development
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });
}

// Database setup
import { setupDatabase, seedDatabase } from './setup-db';

// Initialize services
const documentParser = new DocumentParser();
const sensitiveDataDetector = new AdvancedSensitiveDataDetector();
const cryptoEngine = new NativeContractCrypto();
const analysisEngine = new ContractAnalysisEngine(contractStorage, sensitiveDataDetector, cryptoEngine);

// Setup database on startup
setupDatabase().then(async (success) => {
  if (success) {
    console.log('✅ Database setup completed');
    await seedDatabase();
  } else {
    console.error('❌ Database setup failed');
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'contract-analysis-system' });
});

// Authentication middleware
const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

// Public routes (landing page will be served here in production)
app.get('/', (req, res) => {
  res.json({ 
    message: 'Contract Analysis System API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth/*',
      contracts: '/api/contracts/*',
      tokens: '/api/tokens/*',
      stripe: '/api/stripe/*'
    }
  });
});

// Authentication routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Email válido é obrigatório' });
    }

    // Check if user already exists
    const existingUser = await contractStorage.getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'Usuário já existe' });
    }

    // Create new user
    const user = await contractStorage.createUser({
      email,
      currentPlan: 'free',
      subscriptionStatus: 'active'
    });

    req.session.userId = user.id;
    req.session.userEmail = user.email;

    res.json({
      user: {
        id: user.id,
        email: user.email,
        plan: user.currentPlan
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email é obrigatório' });
    }

    const user = await contractStorage.getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    req.session.userId = user.id;
    req.session.userEmail = user.email;

    const tokenBalance = await contractStorage.getUserTokenBalance(user.id);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        plan: user.currentPlan,
        tokens: tokenBalance?.currentBalance || 0
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.get('/api/auth/user', requireAuth, async (req, res) => {
  try {
    const user = await contractStorage.getUserById(req.session.userId!);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const tokenBalance = await contractStorage.getUserTokenBalance(user.id);
    const stats = await contractStorage.getUserStats(user.id);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        plan: user.currentPlan,
        tokens: tokenBalance?.currentBalance || 0,
        stats
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao fazer logout' });
    }
    res.json({ message: 'Logout realizado com sucesso' });
  });
});

// Contract analysis routes
app.post('/api/contracts/upload', requireAuth, async (req, res) => {
  try {
    const { filename, content, contentType } = req.body;
    
    if (!filename || !content) {
      return res.status(400).json({ error: 'Arquivo e nome são obrigatórios' });
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(content, 'base64');
    
    // Parse document
    const parsed = await documentParser.parseDocument(buffer, filename);
    
    // Detect sensitive data
    const sensitiveData = sensitiveDataDetector.detectSensitiveData(parsed.text);
    
    // Validate contract structure
    const validation = documentParser.validateContractStructure(parsed.text);
    
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Documento não parece ser um contrato válido',
        issues: validation.issues,
        confidence: validation.confidence
      });
    }

    // Detect contract type
    const contractType = documentParser.detectContractType(parsed.text);

    const response = {
      documentId: parsed.metadata.hash,
      metadata: parsed.metadata,
      contractType,
      validation,
      sensitiveDataDetected: sensitiveData.length > 0,
      sensitiveData: sensitiveData.map(item => ({
        type: item.type,
        count: 1,
        suggestion: item.suggestion
      })),
      requiresSecurityChoice: sensitiveData.length > 0
    };

    // Store temporary data for analysis
    req.session.pendingAnalysis = {
      text: parsed.text,
      metadata: parsed.metadata,
      contractType,
      sensitiveData
    };

    res.json(response);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/contracts/security-choice', requireAuth, async (req, res) => {
  try {
    const { choice } = req.body; // 'encrypt', 'fictional', 'reupload'
    const pendingAnalysis = req.session.pendingAnalysis;
    
    if (!pendingAnalysis) {
      return res.status(400).json({ error: 'Nenhuma análise pendente encontrada' });
    }

    if (!['encrypt', 'fictional', 'reupload'].includes(choice)) {
      return res.status(400).json({ error: 'Escolha inválida' });
    }

    if (choice === 'reupload') {
      delete req.session.pendingAnalysis;
      return res.json({ message: 'Faça upload de um novo documento sem dados sensíveis' });
    }

    const userId = req.session.userId!;
    const tokenBalance = await contractStorage.getUserTokenBalance(userId);
    
    if (!tokenBalance) {
      return res.status(400).json({ error: 'Saldo de tokens não encontrado' });
    }

    // Calculate token cost
    let tokenCost = 100; // Base analysis cost
    if (choice === 'encrypt') {
      tokenCost += 50; // Encryption cost
    } else if (choice === 'fictional') {
      tokenCost += 75; // Fictional data replacement cost
    }

    if ((tokenBalance.currentBalance || 0) < tokenCost) {
      return res.status(402).json({ 
        error: 'Tokens insuficientes',
        required: tokenCost,
        available: tokenBalance.currentBalance || 0
      });
    }

    // Process the analysis with full AI engine
    const result = await analysisEngine.processAnalysis({
      userId,
      text: pendingAnalysis.text,
      metadata: pendingAnalysis.metadata,
      contractType: pendingAnalysis.contractType,
      sensitiveData: pendingAnalysis.sensitiveData,
      securityChoice: choice,
      tokenCost
    });

    delete req.session.pendingAnalysis;
    res.json(result);
  } catch (error) {
    console.error('Security choice error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/contracts/analyze-direct', requireAuth, async (req, res) => {
  try {
    const pendingAnalysis = req.session.pendingAnalysis;
    
    if (!pendingAnalysis) {
      return res.status(400).json({ error: 'Nenhuma análise pendente encontrada' });
    }

    if (pendingAnalysis.sensitiveData.length > 0) {
      return res.status(400).json({ error: 'Documento contém dados sensíveis. Use o endpoint de escolha de segurança.' });
    }

    const userId = req.session.userId!;
    const tokenCost = 100; // Base analysis cost

    const tokenBalance = await contractStorage.getUserTokenBalance(userId);
    if (!tokenBalance || (tokenBalance.currentBalance ?? 0) < tokenCost) {
      return res.status(402).json({ 
        error: 'Tokens insuficientes',
        required: tokenCost,
        available: tokenBalance?.currentBalance || 0
      });
    }

    // Process the analysis - temporary implementation
    const result = {
      id: Date.now() + 1,
      scores: { overall: 80, completeness: 85, compliance: 75, protection: 80, clarity: 80 },
      risks: [],
      recommendations: [],
      sensitiveDataDetected: [],
      encryptedContent: null,
      metadata: { contractType: pendingAnalysis.contractType, uploadDate: new Date() }
    };
    
    // TODO: Implement full analysis engine
    // const result = await analysisEngine.processAnalysis({
    //   userId,
    //   text: pendingAnalysis.text,
    //   metadata: pendingAnalysis.metadata,
    //   contractType: pendingAnalysis.contractType,
    //   sensitiveData: [],
    //   securityChoice: 'none',
    //   tokenCost
    // });

    delete req.session.pendingAnalysis;
    res.json(result);
  } catch (error) {
    console.error('Direct analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/contracts/analysis/:id', requireAuth, async (req, res) => {
  try {
    const analysisId = parseInt(req.params.id);
    const analysis = await contractStorage.getContractAnalysis(analysisId);
    
    if (!analysis || analysis.userId !== req.session.userId) {
      return res.status(404).json({ error: 'Análise não encontrada' });
    }

    res.json(analysis);
  } catch (error) {
    console.error('Get analysis error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.get('/api/contracts/history', requireAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const analyses = await contractStorage.getUserContractAnalyses(
      req.session.userId!,
      limit,
      offset
    );

    res.json({
      analyses,
      pagination: {
        page,
        limit,
        hasMore: analyses.length === limit
      }
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Token management routes
app.get('/api/tokens/balance', requireAuth, async (req, res) => {
  try {
    const balance = await contractStorage.getUserTokenBalance(req.session.userId!);
    if (!balance) {
      return res.status(404).json({ error: 'Saldo não encontrado' });
    }

    res.json(balance);
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.get('/api/tokens/history', requireAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;

    const transactions = await contractStorage.getUserTokenTransactions(
      req.session.userId!,
      limit,
      offset
    );

    res.json({
      transactions,
      pagination: {
        page,
        limit,
        hasMore: transactions.length === limit
      }
    });
  } catch (error) {
    console.error('Get token history error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Stripe payment routes
app.get('/api/subscription/plans', (req, res) => {
  res.json({ plans: SUBSCRIPTION_PLANS });
});

app.post('/api/subscription/create-checkout', requireAuth, async (req, res) => {
  try {
    const { planId } = req.body;
    const user = await contractStorage.getUserById(req.session.userId!);
    
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const plan = stripeService.getPlanById(planId);
    if (!plan || plan.id === 'free') {
      return res.status(400).json({ error: 'Plano inválido' });
    }

    // Create Stripe customer if doesn't exist
    let stripeCustomerId = user.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripeService.createCustomer(user.email);
      stripeCustomerId = customer.id;
      await contractStorage.updateUser(user.id, { stripeCustomerId });
    }

    const session = await stripeService.createCheckoutSession(
      stripeCustomerId,
      plan.priceId,
      `${req.get('origin')}/success?session_id={CHECKOUT_SESSION_ID}`,
      `${req.get('origin')}/cancel`
    );

    res.json({ url: session.url });
  } catch (error) {
    console.error('Create checkout error:', error);
    res.status(500).json({ error: 'Erro ao criar sessão de pagamento' });
  }
});

app.post('/api/subscription/portal', requireAuth, async (req, res) => {
  try {
    const user = await contractStorage.getUserById(req.session.userId!);
    
    if (!user?.stripeCustomerId) {
      return res.status(400).json({ error: 'Cliente Stripe não encontrado' });
    }

    const session = await stripeService.createPortalSession(
      user.stripeCustomerId,
      req.get('origin') || 'http://localhost:3001'
    );

    res.json({ url: session.url });
  } catch (error) {
    console.error('Create portal error:', error);
    res.status(500).json({ error: 'Erro ao criar portal do cliente' });
  }
});

app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['stripe-signature'] as string;
  
  try {
    const event = await stripeService.handleWebhook(signature, req.body.toString());
    
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        const subscription = event.data.object as any;
        const customer = await stripeService.getSubscription(subscription.id);
        // Handle subscription updates
        break;
        
      case 'customer.subscription.deleted':
        // Handle subscription cancellation
        break;
        
      case 'invoice.payment_succeeded':
        // Handle successful payment
        break;
        
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
    
    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: 'Webhook signature verification failed' });
  }
});

// Health check endpoints
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: Date.now(),
    service: 'contract-analysis-system'
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: Date.now(),
    service: 'contract-analysis-system'
  });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// Start server
const port = parseInt(process.env.PORT || '3001', 10);
httpServer.listen(port, '0.0.0.0', () => {
  console.log(`🚀 [contract-system] serving on port ${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
  console.log(`🔗 API endpoints: http://localhost:${port}/api`);
});

export default app;