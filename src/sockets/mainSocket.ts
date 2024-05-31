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

        const currUserChatIds = await prisma.user.findUnique({
            where: {
                id: (socket as ISocket).user.id
            },
            select: {
                chats: {
                    select: {
                        id: true
                    }
                }
            }
        });

        // Emit the online status of the user to all of the users friends
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

        currUserChatIds?.chats.forEach(async chat => {
            await prisma.chat.update({
                where: {
                    id: chat.id
                },
                data: {
                    online: true
                }
            })
        })

        friends?.friends.forEach(friend => {
            const friendSocket = currentUsers[friend.id]

            if (!friendSocket) {
                return;
            }

            io.to(friendSocket.socketId).emit('friend-status', {
                id: (socket as ISocket).user.id,
                online: true
            });
        })

        socket.on('join-room', (roomId: string) => {
            socket.join(roomId);
        });

        socket.on('leave-room', (roomId: string) => {
            socket.leave(roomId);
        });

        socket.on('call-made', async (data: { offer: RTCSessionDescriptionInit, chat: string }) => {
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

        socket.on('answer-made', async (data: { answer: RTCSessionDescriptionInit, chat: string }) => {
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

            socket.to(toSocket).emit('answer', {
                answer: data.answer,
                chat: data.chat
            });
        })

        await handleMessage(socket, io);
        await handleFriendRequest(socket as ISocket, io, currentUsers);
        await handleFriendRequestResponse(socket as ISocket, io, currentUsers);

        socket.on('disconnect', () => {
            console.log('user disconnected', socket.id);
            delete currentUsers[(socket as ISocket).user.id];

            // If the user disconnects
            // Set the chat online status to false
            // But only if all users in the chat are offline
            currUserChatIds?.chats.forEach(async chat => {
                const chatUsers = await prisma.chat.findUnique({
                    where: {
                        id: chat.id
                    },
                    select: {
                        users: {
                            select: {
                                id: true
                            }
                        }
                    }
                });

                const onlineUsers = chatUsers?.users.filter(user => currentUsers[user.id]?.online);

                if (onlineUsers?.length === 0) {
                    await prisma.chat.update({
                        where: {
                            id: chat.id
                        },
                        data: {
                            online: false
                        }
                    })
                }
            })
        });
    });
};
