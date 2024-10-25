const express = require('express');
const http = require('http');
const { initDatabase } = require('./config/database');
const { producer, consumer } = require('./config/kafka');
const { initializeWebSocket } = require('./config/websocket');
const { setupKafkaConsumer } = require('./services/kafkaService');
const { initializeClients, handleWebSocketConnection } = require('./services/websocketService');
const pollRoutes = require('./routes/pollRoutes');
const errorMiddleware = require('./middleware/errorMiddleware');

const app = express();
const server = http.createServer(app);
const { wss, clients } = initializeWebSocket(server);

app.use(express.json());
app.use('/', pollRoutes);
app.use(errorMiddleware);

// Initialize WebSocket handlers
initializeClients(clients);
wss.on('connection', handleWebSocketConnection);

// Application startup
const startServer = async () => {
  await initDatabase();
  await producer.connect();
  await setupKafkaConsumer();
  
  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

// Error handling
process.on('SIGTERM', async () => {
  await producer.disconnect();
  await consumer.disconnect();
  await pgPool.end();
  process.exit(0);
});

startServer().catch(console.error);

