import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { chatRoutes } from './routes/chat.js';
import { inventoryRoutes } from './routes/inventory.js';
import { taskRoutes } from './routes/tasks.js';
import { shoppingRoutes } from './routes/shopping.js';

const app = Fastify({ logger: true });

// CORS — allow all origins in dev (tighten for prod)
await app.register(cors, { origin: true });

// Health check
app.get('/health', async () => ({ status: 'ok', app: 'bria-api' }));

// Routes
await app.register(chatRoutes);
await app.register(inventoryRoutes);
await app.register(taskRoutes);
await app.register(shoppingRoutes);

// Start
const port = Number(process.env.PORT) || 3000;
await app.listen({ port, host: '0.0.0.0' });
console.log(`\n🏡 Bria API running on http://localhost:${port}`);
console.log(`   Expose with devtunnel and update EXPO_PUBLIC_API_URL in bria/.env.local\n`);
