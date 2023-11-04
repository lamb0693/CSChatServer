const express = require('express');
const app = express();
const http = require('http');

const dns = require('node:dns');
dns.setDefaultResultOrder('ipv4first');

const server = http.createServer(app);
const { Server } = require("socket.io");


const ioServer = new Server(server, {
    cors: {
        origin: '*'
    }
});

// channel 안 만들면 room이 안 생기는 듯
const counselServer = ioServer.of('/counsel')

// 방 만들기에 대한 
let counselRooms = null; // adapter로 구할 방
let counselRoomsTransfer = []; // transfer 용 array를 만듬

// server의 quizRooms, quizRoomsTransfer 를 update //
// callback 함수에서 온 거라 ioServer 필요
const updateRoom = () => {
    counselRooms = counselServer.adapter.rooms;
    console.log("counselRooms >>" + counselRooms)
    counselRoomsTransfer = [];
    counselRooms.forEach((room, roomName) => {
        //console.log(roomName.length) - default room name
        //** id를 15자 이하로 꼭 하자 */
        if (roomName.length <= 15) {
            counselRoomsTransfer.push({
                'roomName': roomName,
                'roomSize': room.size
            });
        }
    });
    console.log('roomList : ', counselRoomsTransfer)
};

const checkExistRoomByName = (roomName) => {
    let bExist;
    bExist = false;
    for (let i = 0; i < counselRoomsTransfer.length; i++) {
        if (counselRoomsTransfer[i].roomName == roomName) {
            bExist = true;
            break;
        }
    }
    console.log('checkExistRooms returns ' + bExist);
    return bExist;
};

const getRoomSize = (roomName) => {
    for (let i = 0; i < counselRoomsTransfer.length; i++) {
        if (counselRoomsTransfer[i].roomName === roomName)
            return counselRoomsTransfer[i].roomSize;
    }
    return -1;
};

const updateRoomAndSendRoomListtoAllClient = () => {
    updateRoom();
    console.log('emitting counsel_rooms_info message', counselRoomsTransfer)
    counselServer.emit('counsel_rooms_info', counselRoomsTransfer); 
};


counselServer.on('connection', (socket) => {
    console.log('a user connected');
    console.log(counselServer.adapter.rooms)
    // 나중에 지우자s
    //socket.emit("chat_data", "server says Hello")
    updateRoomAndSendRoomListtoAllClient();
    //counselServer.emit("chat_data", "hello")

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

    // // ********* CHAT MESSAGE EVENT ******************//
    // socket.on('chat_data', (param) => {
    //     console.log("chat_data :" + param)
    //     counselServer.emit('chat_data', param);
    // });

    // ********* CHAT MESSAGE EVENT ******************//
    socket.on('update_board', (roomName) => {
        console.log("update_board : arrived" )
        counselServer.emit('update_board', 'do update');
    });


    


    // *********** CREATE ROOM******************//
    // callback 을 하니 Kotlin 함수가 넘어와도 처리가 잘 안됨
    // client에서 처리하도록 message만 보냄
    socket.on('create_room', (roomName) => {
        console.log('create_room name : ' + roomName);
        if(checkExistRoomByName(roomName)){
            counselServer.emit('create_room_result', 'fail')
        } else {
            socket.join(roomName)
            counselServer.emit('create_room_result', 'success')
            updateRoomAndSendRoomListtoAllClient()
        }
    });

    socket.on('leave_room', (roomName) => {
        console.log('leave_room :' + roomName)
        socket.leave(roomName)
        updateRoomAndSendRoomListtoAllClient()
        counselServer.emit('user_left_room', roomName)
    })

    // user_left_room -> csr - > csr_leave_room 방 비운다
    socket.on('csr_leave_room', (roomName) => {
        console.log('leave_room :' + roomName)
        socket.leave(roomName)
        updateRoomAndSendRoomListtoAllClient()
    })

    socket.on('join_room', (roomName) => {
        if( checkExistRoomByName(roomName) ) {
            socket.join(roomName)
            updateRoomAndSendRoomListtoAllClient()
            console.log('상담원이 join 함')
            counselServer.emit('csr_joined', 'CSR joined room')
        } else {
            console.log('방이 없어요')
            socket.emit('no room exist', 'csr fail to join')
        }

    })

});

server.listen(3000, () => {
    console.log('listening on *:3000');
});
