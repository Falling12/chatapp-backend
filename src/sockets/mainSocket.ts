// chatSocket.ts
import { Server, Socket } from "socket.io";
import { ISocket } from "../../types";
import { handleMessage } from "./chatSocket";
import { handleFriendRequest, handleFriendRequestResponse } from "./userSocket";

const currentUsers: Record<string, string> = {}

export default (io: Server) => {
    const mainNamespace = io.on('connection', async (socket: Socket) => {
        console.log('user connected', socket.id, (socket as ISocket).user)

        currentUsers[(socket as ISocket).user.id] = socket.id

        console.log(currentUsers)

        socket.on('join-room', (roomId: string) => {
            socket.join(roomId)

            io.except(socket.id).to(roomId).emit('message', `User ${(socket as ISocket).user.name} has joined the room`)
        })

        socket.on('leave-room', (roomId: string) => {
            socket.leave(roomId)

            io.except(socket.id).to(roomId).emit('message', `User ${(socket as ISocket).user.name} has left the room`)
        })

        await handleMessage(socket, io)
        await handleFriendRequest(socket as ISocket, io, currentUsers)
        await handleFriendRequestResponse(socket as ISocket, io, currentUsers)

        socket.on('disconnect', () => {
            console.log('user disconnected', socket.id)

            delete currentUsers[(socket as ISocket).user.id]
        })
    })
}