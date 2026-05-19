import express from 'express';
import { createServer } from 'http';
import path from 'path';
import cors from 'cors';
import session from 'express-session';
import { fileURLToPath } from 'url';

// Import contract system routes
import './index';

const app = express();
const server = createServer(app);

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'contratos-dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'contract-analysis-system',
    timestamp: new Date().toISOString()
  });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const clientPath = path.join(__dirname, '../client/dist');
  app.use(express.static(clientPath));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientPath, 'index.html'));
  });
}

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🚀 Contract Analysis Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  
  if (process.env.NODE_ENV !== 'production') {
    console.log(`🔧 Development mode - Frontend proxy on port 3001`);
  }
});

export default server;