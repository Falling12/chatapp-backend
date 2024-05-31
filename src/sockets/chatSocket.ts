import { Server, Socket } from "socket.io";
import { PrismaClient } from "@prisma/client";
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
                    }
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
                    }
                }
            })

            io.to(data.room).emit('message', msg)
        } catch (error) {
            console.log(error)
        }
    })
}