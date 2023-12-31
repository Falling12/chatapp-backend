// chatSocket.ts
import { Server, Socket } from "socket.io";
import { ISocket } from "../../types";
import { handleMessage } from "./chatSocket";

export default (io: Server) => {
    const mainNamespace = io.on('connection', async (socket: Socket) => {
        console.log('user connected', socket.id, (socket as ISocket).user)

        socket.on('join-room', (roomId: string) => {
            socket.join(roomId)

            io.except(socket.id).to(roomId).emit('message', `User ${(socket as ISocket).user.name} has joined the room`)
        })

        socket.on('leave-room', (roomId: string) => {
            socket.leave(roomId)

            io.except(socket.id).to(roomId).emit('message', `User ${(socket as ISocket).user.name} has left the room`)
        })

        await handleMessage(socket, io)

        socket.on('disconnect', () => {
            console.log('user disconnected', socket.id)
        })
    })
}