const { WebSocketServer } = require('ws');
const { setupWSConnection } = require('y-websocket/bin/utils');

const server = new WebSocketServer({ noServer: true });

server.on('connection', (conn, req) => {
  setupWSConnection(conn, req, { docName: 'monaco-editor' });
});

module.exports = (req, res) => {
  if (req.method === 'GET') {
    res.status(200).json({ message: "Server is running" });
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
};

// This is required for the WebSocket server to properly handle connections in a serverless environment
server.on('upgrade', (req, socket, head) => {
  server.handleUpgrade(req, socket, head, (ws) => {
    server.emit('connection', ws, req);
  });
});
