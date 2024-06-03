import { Server, Socket } from "socket.io";
import { ISocket } from "../../types";
import { handleMessage } from "./chatSocket";
import { handleFriendRequest, handleFriendRequestResponse } from "./userSocket";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const currentUsers: Record<string, {
    socketId: string,
    userId: string,
    name: string,
    online: boolean
}> = {};

export default (io: Server) => {
    io.on('connection', async (socket: Socket) => {
        console.log('user connected', socket.id, (socket as ISocket).user);

        currentUsers[(socket as ISocket).user.id] = {
            socketId: socket.id,
            userId: (socket as ISocket).user.id,
            name: (socket as ISocket).user.name,
            online: true
        }

        const friends = await prisma.user.findUnique({
            where: {
                id: (socket as ISocket).user.id
            },
            select: {
                friends: {
                    select: {
                        id: true
                    }
                }
            }
        });

        await prisma.user.update({
            where: {
                id: (socket as ISocket).user.id
            },
            data: {
                online: true
            }
        });


        friends?.friends.forEach(friend => {
            const friendSocket = currentUsers[friend.id]

            if (!friendSocket) {
                return;
            }

            io.to(friendSocket.socketId).emit('friend-status', {
                id: (socket as ISocket).user.id,
                name: (socket as ISocket).user.name,
                online: true
            });
        });

        socket.on('join-room', (roomId: string) => {
            socket.join(roomId);
        });

        socket.on('leave-room', (roomId: string) => {
            socket.leave(roomId);
        });

        socket.on('call-made', async (data: { offer: string, chat: string }) => {
            console.log(data);
            const chat = await prisma.chat.findUnique({
                where: {
                    id: data.chat
                },
                select: {
                    users: true
                }
            });

            const to = chat?.users.find(user => user.id !== (socket as ISocket).user.id);

            if (!to) {
                return;
            }

            const toSocket = currentUsers[to.id].socketId

            if (!toSocket) {
                return;
            }

            io.to(toSocket).emit('call', {
                offer: data.offer,
                chat: data.chat
            });
        })

        socket.on('answer-made', async (data: { answer: string, chat: string }) => {
            const chat = await prisma.chat.findUnique({
                where: {
                    id: data.chat
                },
                select: {
                    users: true
                }
            });

            const to = chat?.users.find(user => user.id !== (socket as ISocket).user.id);

            if (!to) {
                return;
            }

            const toSocket = currentUsers[to.id]

            if (!toSocket) {
                return;
            }

            socket.to(toSocket.socketId).emit('answer', {
                answer: data.answer,
                chat: data.chat
            });
        })

        await handleMessage(socket, io);
        await handleFriendRequest(socket as ISocket, io, currentUsers);
        await handleFriendRequestResponse(socket as ISocket, io, currentUsers);

        socket.on('disconnect', async() => {
            console.log('user disconnected', socket.id);
            delete currentUsers[(socket as ISocket).user.id];

            friends?.friends.forEach(friend => {
                const friendSocket = currentUsers[friend.id]


                if (!friendSocket) {
                    return;
                }

                io.to(friendSocket.socketId).emit('friend-status', {
                    id: (socket as ISocket).user.id,
                    name: (socket as ISocket).user.name,
                    online: false
                });
            });

            await prisma.user.update({
                where: {
                    id: (socket as ISocket).user.id
                },
                data: {
                    online: false
                }
            });
        });
    });
};
