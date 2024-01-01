import { Server, Socket } from "socket.io";
import { PrismaClient } from "@prisma/client";
import { ISocket } from "../../types";

const prisma = new PrismaClient()

export const handleMessage = async (socket: Socket, io: Server) => {
    socket.on('message', async (message: string) => {
        const room = Array.from(socket.rooms)[1]

        const msg = await prisma.message.create({
            data: {
                text: message,
                chat: {
                    connect: {
                        id: room
                    }
                },
                user: {
                    connect: {
                        id: (socket as ISocket).user.id
                    }
                }
            }
        })

        io.to(room).emit('message', msg)
    })
}