const { producer, consumer } = require('../config/kafka');
const { broadcastPollUpdate } = require('./websocketService');
const { pgPool } = require('../config/database');

const setupKafkaConsumer = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: 'poll-votes', fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ message }) => {
      const { pollId, optionId } = JSON.parse(message.value.toString());
      const client = await pgPool.connect();

      try {
        await client.query('BEGIN');
        await client.query(
          'UPDATE poll_options SET votes = votes + 1 WHERE id = $1',
          [optionId]
        );
        await client.query(
          'INSERT INTO votes (poll_id, option_id) VALUES ($1, $2)',
          [pollId, optionId]
        );
        await client.query('COMMIT');
        await broadcastPollUpdate(pollId);
      } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error processing vote:', error);
      } finally {
        client.release();
      }
    },
  });
};

const sendVote = async (pollId, optionId) => {
  await producer.send({
    topic: 'poll-votes',
    messages: [
      {
        key: String(pollId),
        value: JSON.stringify({ pollId, optionId }),
        partition: pollId % 3,
      },
    ],
  });
};

module.exports = { setupKafkaConsumer, sendVote };
