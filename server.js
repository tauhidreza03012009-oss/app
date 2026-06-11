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
  
  // Set default spawn data along with starting score profile
  activePlayers[socket.id] = { x: 0, y: 100, z: 30, rotY: 0, score: 0 };
  socket.emit('init', socket.id);

  socket.on('move', (data) => {
    if (activePlayers[socket.id]) {
      activePlayers[socket.id].x = data.x;
      activePlayers[socket.id].y = data.y;
      activePlayers[socket.id].z = data.z;
      activePlayers[socket.id].rotY = data.rotY;
    }
  });

  // ── SHOOTING HIT REGISTRATION ──────────────────────────────────────────────
  socket.on('shoot', (targetId) => {
    if (activePlayers[targetId] && activePlayers[socket.id]) {
      // Award shooter a point
      activePlayers[socket.id].score += 1;
      
      // Tell the target client they were eliminated to trigger local respawn
      io.to(targetId).emit('respawn');
      
      // Instantly broadcast the scoring payload to eliminate latency lag
      io.emit('tick', activePlayers);
    }
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
