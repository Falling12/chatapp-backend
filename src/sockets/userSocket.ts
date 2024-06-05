import { Server } from "socket.io";
import { ISocket } from "../../types";
import { PrismaClient } from "@prisma/client";
import Redis from "ioredis";

const prisma = new PrismaClient();

export const handleFriendRequest = async (
    socket: ISocket, 
    io: Server, 
    redis: Redis
) => {
    socket.on('friend-request', async (userId: string) => {
        const user = await prisma.user.findUnique({
            where: {
                id: userId
            },
            select: {
                id: true,
                name: true,
                email: true,
                imageUrl: true
            }
        });

        if (!user) {
            return socket.emit('friend-request', { message: 'User not found', success: false });
        }

        const friendRequest = await prisma.friendRequest.create({
            data: {
                sender: {
                    connect: {
                        id: socket.user.id
                    }
                },
                receiver: {
                    connect: {
                        id: userId
                    }
                },
                status: 'pending',
            },
            select: {
                id: true,
                status: true,
                sender: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        imageUrl: true
                    }
                },
                receiver: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        imageUrl: true
                    }
                }
            }
        });

        const receiverSocket = await redis.hgetall(`user:${userId}`);

        if (!receiverSocket.socketId) {
            return;
        }

        io.to(receiverSocket.socketId).emit('friend-request', { friendRequest, message: 'Friend request received', success: true });
    });
};

export const handleFriendRequestResponse = async (
    socket: ISocket, 
    io: Server, 
    redis: Redis
) => {
    socket.on('friend-request-response', async (data: any) => {
        const { status, friendRequestId } = data;

        console.log(data);

        const friendRequest = await prisma.friendRequest.update({
            where: {
                id: friendRequestId
            },
            data: {
                status: status
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                receiver: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });

        if (status === 'accepted') {
            await prisma.user.update({
                where: {
                    id: friendRequest.sender.id
                },
                data: {
                    friends: {
                        connect: {
                            id: friendRequest.receiver.id
                        }
                    }
                }
            });

            await prisma.user.update({
                where: {
                    id: friendRequest.receiver.id
                },
                data: {
                    friends: {
                        connect: {
                            id: friendRequest.sender.id
                        }
                    }
                }
            });
        }

        const friendRequestSenderSocket = await redis.hgetall(`user:${friendRequest.sender.id}`);

        if (!friendRequestSenderSocket.socketId) {
            return;
        }

        io.to(friendRequestSenderSocket.socketId).emit('friend-request-response', { friendRequest, message: 'Friend request response received', success: true });
    });
};