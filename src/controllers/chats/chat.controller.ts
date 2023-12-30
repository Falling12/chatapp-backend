import type { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { IRequestWithUser } from '../../../types'

const prisma = new PrismaClient()

export const getUserChats = async (req: IRequestWithUser, res: Response) => {
    console.log(req)

    const chats = await prisma.chat.findMany({
        where: {
            users: {
                some: {
                    id: req.user?.id
                }
            }
        },
        include: {
            users: {
                select: {
                    id: true,
                    name: true,
                    email: true
                }
            },
            messages: true
        }
    })

    return res.json({ data: chats, success: true })
}

export const createNewChat = async (req: IRequestWithUser, res: Response) => {
    const { name, userIds } = req.body

    try {
        const chat = await prisma.chat.create({
            data: {
                name: name,
                users: {
                    connect: userIds.map((id: string) => ({ id }))
                }
            },
            include: {
                users: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                messages: true
            }
        })

        return res.json({ data: chat, success: true })
    } catch (error) {
        console.log(error)

        return res.status(500).json({ message: 'Error creating chat', success: false })
    }
}