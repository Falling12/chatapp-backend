import { Server } from "socket.io";
import { ISocket } from "../../types";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient()

export const handleFriendRequest = async (socket: ISocket, io: Server, currentUsers: Record<string, string>) => {
    socket.on('friend-request', async (userId: string) => {
        const user = await prisma.user.findUnique({
            where: {
                id: userId
            },
            select: {
                id: true,
                name: true,
                email: true
            }
        })

        if (!user) {
            return socket.emit('friend-request', { message: 'User not found', success: false })
        }

        const friendRequest = await prisma.friendRequest.create({
            data: {
                sender: {
                    connect: {
                        id: (socket as ISocket).user.id
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
                        email: true
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
        })

        const receiverSocketId = currentUsers[userId]

        io.to(receiverSocketId).emit('friend-request', { friendRequest, message: 'Friend request received', success: true })
    })
}

export const handleFriendRequestResponse = async (socket: ISocket, io: Server, currentUsers: Record<string, string>) => {
    socket.on('friend-request-response', async (data: any) => {
        const { status, friendRequestId } = data

        console.log(data)

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
        })

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
            })

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
            })
        }

        const friendRequestSenderSocketId = currentUsers[friendRequest.sender.id]

        io.to(friendRequestSenderSocketId).emit('friend-request-response', { friendRequest, message: 'Friend request response received', success: true })
    })
}