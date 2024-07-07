const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
    credentials: true
  }
});

app.use(cors());

io.on('connection', (socket) => {
  console.log('a user connected');
  
  socket.on('codeChange', (code) => {
    socket.broadcast.emit('codeChange', code);
  });

  socket.on('executeCode', async (code) => {
    try {
      const response = await axios.post("https://emkc.org/api/v2/piston/execute", {
        language: 'java',
        version: '15.0.2',
        files: [
          {
            content: code,
          },
        ],
      });
      socket.emit('executionResult', response.data.run.output);
    } catch (error) {
      socket.emit('executionResult', 'Error running code');
      console.error(error);
    }
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
