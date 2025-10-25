import express from 'express';
import cors from 'cors';
import db from './src/config/db.js';

// Import routes
import stockRoutes from './src/routes/stock.js';
import productRoutes from './src/routes/products.js';
import categoryRoutes from './src/routes/categories.js';
import warehouseRoutes from './src/routes/warehouses.js';

// Import middleware
import { errorHandler, notFound } from './src/middlewares/errorHandler.js';
import { corsHandler } from './src/middlewares/cors.js';

const app = express();
const port = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(corsHandler);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/stock', stockRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/warehouses', warehouseRoutes);

// Database health check
db.query('SELECT 1 + 1 AS result', (err, results) => {
  if (err) {
    console.error('❌ Database health check failed:', err.message);
  } else {
    console.log('✅ Database is healthy. Test query result:', results[0].result);
  }
});

// Error handling middleware (must be last)
app.use(notFound);
app.use(errorHandler);

// Start server
app.listen(port, () => {
  console.log(`🚀 Server started on port ${port}`);
  console.log(`📊 Stock Management API available at http://localhost:${port}/api`);
  console.log(`🏥 Health check available at http://localhost:${port}/health`);
});