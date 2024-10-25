const WebSocket = require('ws');
const { pgPool } = require('../config/database');

let clients;

const initializeClients = (clientsMap) => {
  clients = clientsMap;
};

const handleWebSocketConnection = (ws, req) => {
  const pollId = new URL(req.url, 'http://localhost').searchParams.get('pollId');
  if (pollId) {
    if (!clients.has(pollId)) {
      clients.set(pollId, new Set());
    }
    clients.get(pollId).add(ws);
  }
  if (subscribeToLeaderboard) {
    if (!clients.has('leaderboard')) {
      clients.set('leaderboard', new Set());
    }
    clients.get('leaderboard').add(ws);
  }

  ws.on('close', () => {
    if (pollId && clients.has(pollId)) {
      clients.get(pollId).delete(ws);
      if (clients.get(pollId).size === 0) {
        clients.delete(pollId);
      }
    }
    if (subscribeToLeaderboard && clients.has('leaderboard')) {
      clients.get('leaderboard').delete(ws);
    }
  });
};

const broadcastPollUpdate = async (pollId) => {
  if (!clients.has(pollId)) return;

  const result = await pgPool.query(
    `SELECT po.*, p.title 
     FROM poll_options po 
     JOIN polls p ON po.poll_id = p.id 
     WHERE poll_id = $1`,
    [pollId]
  );

  const pollData = {
    pollId,
    options: result.rows,
  };

  clients.get(pollId).forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(pollData));
    }
  });
};
// broadcast leaderboard updates
async function broadcastLeaderboardUpdate() {
  if (!clients.has('leaderboard')) return;

  try {
    const result = await pgPool.query(`
      SELECT 
        p.title as poll_title, 
        po.option_text, 
        po.votes,
        RANK() OVER (ORDER BY po.votes DESC) as rank
      FROM poll_options po
      JOIN polls p ON po.poll_id = p.id
      ORDER BY po.votes DESC
      LIMIT 10
    `);

    const leaderboardData = {
      type: 'leaderboard',
      timestamp: Date.now(),
      rankings: result.rows
    };

    clients.get('leaderboard').forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(leaderboardData));
      }
    });
  } catch (error) {
    console.error('Error broadcasting leaderboard:', error);
  }
}


module.exports = {
  initializeClients,
  handleWebSocketConnection,
  broadcastPollUpdate,
};