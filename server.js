import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const server = createServer(app);

// Allow game data to pass through securely
const io = new Server(server, {
  cors: { origin: "*" }
});

// Serve your index.html and any local assets automatically
app.use(express.static(__dirname));

// Master object keeping track of all online players
const activePlayers = {};

io.on('connection', (socket) => {
  console.log(`Player joined: ${socket.id}`);

  // 1. Tell the new player what their network ID is
  socket.emit('init', socket.id);

  // 2. Receive live movement data from a single player
  socket.on('move', (data) => {
    if (activePlayers[socket.id]) {
      activePlayers[socket.id].x = data.x;
      activePlayers[socket.id].y = data.y;
      activePlayers[socket.id].z = data.z;
      activePlayers[socket.id].rotY = data.rotY;
    } else {
      // If they aren't registered yet, create their data profile
      activePlayers[socket.id] = data;
    }
  });

  // 3. Handle a player closing the tab or disconnecting
  socket.on('disconnect', () => {
    console.log(`Player left: ${socket.id}`);
    delete activePlayers[socket.id];
    // Broadcast immediately so other players can delete their avatar mesh
    io.emit('removePlayer', socket.id);
  });
});

// 🚀 THE HEARTBEAT: Broadcast everyone's positions to all connected screens 
// 60 times per second (approx. 16.6ms intervals)
setInterval(() => {
  io.emit('tick', activePlayers);
}, 1000 / 60);

// Host on the cloud environment's chosen port, fallback to 3000 locally
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server blasting off on port ${PORT}`);
});
    
