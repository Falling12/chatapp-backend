import { Server, Socket } from "socket.io";
import { Prisma, PrismaClient, User } from "@prisma/client";
import { ISocket } from "../../types";

const prisma = new PrismaClient()

export const handleMessage = async (socket: Socket, io: Server) => {
    socket.on('message', async (data: {message: string, room: string}) => {
        try {
            const msg = await prisma.message.create({
                data: {
                    text: data.message,
                    chat: {
                        connect: {
                            id: data.room
                        }
                    },
                    user: {
                        connect: {
                            id: (socket as ISocket).user.id
                        }
                    },
                    hasRead: false
                },
                select: {
                    id: true,
                    text: true,
                    createdAt: true,
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            imageUrl: true
                        }
                    },
                    hasRead: true
                }
            })

            io.to(data.room).emit('message', msg)
        } catch (error) {
            console.log(error)
        }
    })

    socket.on('typing', async (data: {room: string, typing: boolean, user: string}) => {
        const user = await prisma.user.findFirst({
            where: {
                id: data.user
            },
            select: {
                id: true,
                name: true,
                email: true,
                imageUrl: true
            }
        })
    
        // Send the typing event to all users in the room except the user typing
        socket.broadcast.to(data.room).emit('typing', {user: user, typing: data.typing});
    })

    socket.on('markAsRead', async (data: { messages: string[], room: string }) => {
        try {
            const messages = await prisma.$queryRaw`UPDATE "Message" SET "hasRead" = true WHERE id IN (${Prisma.join(data.messages)}) RETURNING *`

            console.log(messages)
    
            io.to(data.room).emit('markAsRead', messages)
        } catch (error) {
            console.log(error)
        }
    })
    
}