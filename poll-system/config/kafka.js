const { Kafka ,Partitioners ,logLevel } = require('kafkajs');


//Kafka configuration with Zookeeper settings
const kafka = new Kafka({
  clientId: 'polling-app',
  brokers: ['localhost:9092'],

 // Add Zookeeper connection details
 zookeeper: {
  connectionString: 'localhost:2181',
  sessionTimeout: 30000,
  syncTime: 10000,
  retries: 5
},

// Enhanced logging for better monitoring
logLevel: logLevel.INFO,
// Retry settings for fault tolerance
retry: {
  initialRetryTime: 100,
  retries: 8
}


});


const producer = kafka.producer(
  {
    createPartitioner: Partitioners.LegacyPartitioner,

     // Enable idempotent writes to prevent duplicate messages
  idempotent: true,
  // Enhanced transaction settings
  transactionalId: 'polling-producer-tx',
  maxInFlightRequests: 1
  }
);


async function broadcastPollUpdate(pollId) {
  // Implement WebSocket or SSE broadcast logic here
  console.log(`Broadcasting poll update for poll ${pollId}`);
}

async function broadcastLeaderboardUpdate() {
  // Implement WebSocket or SSE broadcast logic here
  console.log('Broadcasting leaderboard update');
}
const consumer = kafka.consumer({ groupId: 'poll-group' });

module.exports = { kafka, producer, consumer,broadcastPollUpdate,broadcastLeaderboardUpdate };