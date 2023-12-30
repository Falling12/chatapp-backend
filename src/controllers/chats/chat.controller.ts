import type { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { IRequestWithUser } from '../../../types'

const prisma = new PrismaClient()

export const getUserChats = async (req: IRequestWithUser, res: Response) => {
    console.log(req)

    const chats = await prisma.chat.findMany({
        where: {
            Users: {
                some: {
                    id: req.user?.id
                }
            }
        },
        include: {
            Users: true,
            Messages: true
        }
    })

    return res.json({ data: chats, success: true })
}