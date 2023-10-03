const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");


const ioServer = new Server(server, {
    cors: {
        origin: '*'
    }
});


ioServer.on('connection', (socket) => {
    console.log('a user connected');

    socket.on('disconnect', () => {
        console.log('user disconnected');

    });

    // ********* audio_data EVENT ******************//

    socket.on('audio_data', (param) => {
        console.log('audio_data arrived')
        //console.log(param)
        socket.broadcast.emit('audio_data', param)
    });

    socket.on('canvas_data', (param) => {
        console.log('canvas_data arrived')
        //console.log(param)
        socket.broadcast.emit('canvas_data', param)
    });

    // ********* CHAT MESSAGE EVENT ******************//
    socket.on('chat_data', (param) => {
        ioServer.emit('chat_data', param);
    });
});

server.listen(3000, () => {
    console.log('listening on *:3000');
});
