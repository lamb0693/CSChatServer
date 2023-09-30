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
        ioServer.emit('audio_data', param)
    });

    socket.on('canvas_data', (param) => {
        console.log('canvas_data arrived')
        //console.log(param)
        ioServer.emit('canvas_data', param)
    });

    // ********* CHAT MESSAGE EVENT ******************//
    socket.on('chatData', (param) => {
        ioServer.emit('chat message', param.nickname + ':' + param.message);
    });
});

server.listen(3000, () => {
    console.log('listening on *:3000');
});
