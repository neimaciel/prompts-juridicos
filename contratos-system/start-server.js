const { spawn } = require('child_process');
const path = require('path');

const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

console.log(`Starting contract server on port ${PORT}...`);

const serverProcess = spawn('npx', ['tsx', 'server/index.ts'], {
  cwd: __dirname,
  env: {
    ...process.env,
    PORT: PORT,
    NODE_ENV: NODE_ENV
  },
  stdio: 'inherit'
});

serverProcess.on('error', (error) => {
  console.error('Failed to start contract server:', error);
  process.exit(1);
});

serverProcess.on('exit', (code) => {
  console.log(`Contract server process exited with code ${code}`);
  if (code !== 0) {
    process.exit(code);
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down contract server...');
  serverProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('Shutting down contract server...');
  serverProcess.kill('SIGTERM');
});