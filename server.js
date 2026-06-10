import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const server = createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(express.static(__dirname));

const activePlayers = {};

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);
  socket.emit('init', socket.id);

  socket.on('move', (data) => {
    activePlayers[socket.id] = {
      x: data.x,
      y: data.y,
      z: data.z,
      rotY: data.rotY
    };
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    delete activePlayers[socket.id];
    io.emit('removePlayer', socket.id);
  });
});

// Run the network broadcast tick loop at 60Hz 
setInterval(() => {
  io.emit('tick', activePlayers);
}, 1000 / 60);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`High-speed prediction server active on port ${PORT}`);
});
