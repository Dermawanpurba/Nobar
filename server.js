const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
// Mengatur Socket.io agar menerima koneksi dari website mana saja
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

io.on('connection', (socket) => {
    console.log('User terhubung:', socket.id);

    // Bergabung ke ruangan
    socket.on('join-room', (roomId, isHost) => {
        socket.join(roomId);
        socket.to(roomId).emit('user-connected', socket.id);
        console.log(`User ${socket.id} bergabung ke ${roomId}`);

        // Chatting
        socket.on('chat-message', (message) => {
            socket.to(roomId).emit('chat-message', message);
        });

        // Sinkronisasi YouTube (Perintah Play/Pause/Seek)
        socket.on('sync-yt', (data) => {
            socket.to(roomId).emit('sync-yt', data);
        });

        // WebRTC Signaling untuk Screen Share (Netflix)
        socket.on('webrtc-signal', (data) => {
            // Mengirim sinyal WebRTC (Offer, Answer, ICE Candidates) ke spesifik user
            io.to(data.to).emit('webrtc-signal', {
                from: socket.id,
                signal: data.signal
            });
        });

        socket.on('disconnect', () => {
            socket.to(roomId).emit('user-disconnected', socket.id);
            console.log('User terputus:', socket.id);
        });
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server backend berjalan di port ${PORT}`);
});
