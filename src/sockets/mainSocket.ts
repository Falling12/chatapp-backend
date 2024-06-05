import { Server, Socket } from "socket.io";
import { ISocket } from "../../types";
import { handleMessage } from "./chatSocket";
import { handleFriendRequest, handleFriendRequestResponse } from "./userSocket";
import { PrismaClient } from "@prisma/client";
import { Redis } from "ioredis";

const prisma = new PrismaClient();
const redis = new Redis({
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT as string),
    password: process.env.REDIS_PASSWORD
});

export default (io: Server) => {
    io.on('connection', async (socket: Socket) => {
        const userId = (socket as ISocket).user.id;
        const userName = (socket as ISocket).user.name;

        await redis.hset(`user:${userId}`, {
            socketId: socket.id,
            userId: userId,
            name: userName,
            online: true
        });

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


        friends?.friends.forEach(async friend => {
            const friendSocket = await redis.hgetall(`user:${friend.id}`);

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

            const toSocket = await redis.hgetall(`user:${to.id}`);

            if (!toSocket) {
                return;
            }

            io.to(toSocket.socketId).emit('call', {
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

            const toSocket = await redis.hgetall(`user:${to.id}`);

            if (!toSocket) {
                return;
            }

            socket.to(toSocket.socketId).emit('answer', {
                answer: data.answer,
                chat: data.chat
            });
        })

        await handleMessage(socket, io);
        await handleFriendRequest(socket as ISocket, io, redis);
        await handleFriendRequestResponse(socket as ISocket, io, redis);

        socket.on('disconnect', async() => {
            console.log('user disconnected', socket.id);
            await redis.hdel(`user:${userId}`, 'socketId', 'userId', 'name', 'online');

            friends?.friends.forEach(async friend => {
                const friendSocket = await redis.hgetall(`user:${friend.id}`);


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
