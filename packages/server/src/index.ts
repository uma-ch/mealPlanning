import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';
import recipeRoutes from './routes/recipes.js';
import calendarRoutes from './routes/calendar.js';
import groceryRoutes from './routes/grocery.js';
import authRoutes from './routes/auth.js';
import householdRoutes from './routes/household.js';
import extensionRoutes from './routes/extension.js';
import apiKeysRoutes from './routes/apiKeys.js';
import { setupSocketHandlers } from './socket/handlers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Ensure temp-uploads directory exists
const tempUploadsDir = path.join(__dirname, '../temp-uploads');
mkdirSync(tempUploadsDir, { recursive: true });

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/grocery', groceryRoutes);
app.use('/api/household', householdRoutes);
app.use('/api/extension', extensionRoutes);
app.use('/api/api-keys', apiKeysRoutes);

// Serve static files from client build in production
const clientDistPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));

// Catch-all route to serve index.html for client-side routing
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

// Socket.io setup
setupSocketHandlers(io);

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export { io };
