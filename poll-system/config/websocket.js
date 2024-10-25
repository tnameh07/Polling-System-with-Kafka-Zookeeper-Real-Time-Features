const WebSocket = require('ws');
const clients = new Map();

const initializeWebSocket = (server) => {
  const wss = new WebSocket.Server({ server });
  return { wss, clients };
};

module.exports = { initializeWebSocket };