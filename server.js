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
    counselServer.emit('counsel_rooms_info', counselRoomsTransfer); // 방 list를 보낸다 get_room_list callback으로 대체
};


counselServer.on('connection', (socket) => {
    console.log('a user connected');
    console.log(counselServer.adapter.rooms)
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

    // ********* CHAT MESSAGE EVENT ******************//
    socket.on('chat_data', (param) => {
        console.log("chat_data :" + param)
        counselServer.emit('chat_data', param);
    });


    // *********** CREATE ROOM******************//
    // callback 을 하니 Kotlin 함수가 넘어와도 처리가 잘 안됨
    // client에서 처리하도록 message만 보냄
    socket.on('create_room', (roomName) => {
        console.log('create_room name : ' + roomName);
        counselServer.emit('create_room_result', 'success')
        // 있으면 clientCallback('fail') 
        // 없으면 join(방 만들기) clientCallback('success') 실행 
        // if (checkExistRoomByName(roomName)) {
        //     //console.log("on quiz_create_room : room exist")
        //     clientCallback('fail', roomName);
        // }
        // else {
        //     //console.log("make new room " + roomName)
        //     socket.join(roomName);
        //     clientCallback('success', roomName);
        //     // gameData 준비
        //    // prepareGame(roomName, txtUserId, txtUserNick, socket.id, 0);
        //     updateRoomAndSendRoomListtoAllClient(); // join하면 room 현황 broadcasiting
        // }
    });

});

server.listen(3000, () => {
    console.log('listening on *:3000');
});
