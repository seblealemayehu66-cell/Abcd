import { Server } from "socket.io";

export default function socket(server){

const io = new Server(server,{
    cors:{
        origin:"*"
    }
});

io.on("connection",(socket)=>{

    console.log("User connected");

    socket.on("join_chat",(chatId)=>{
        socket.join(chatId);
    });

    socket.on("send_message",(data)=>{

        io.to(data.chatId).emit("receive_message",data);

    });

});

}