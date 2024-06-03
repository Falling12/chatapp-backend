import type { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { IRequestWithUser } from '../../../types'

const prisma = new PrismaClient()

export const getUserChats = async (req: IRequestWithUser, res: Response) => {
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
                    email: true,
                    imageUrl: true,
                    online: true
                }
            },
            messages: {
                take: 10,
                orderBy: {
                    createdAt: 'asc'
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            imageUrl: true,
                            online: true
                        }
                    }
                }
            }
        }
    })

    return res.json({ data: chats, success: true })
}

export const createNewChat = async (req: IRequestWithUser, res: Response) => {
    const { name, userIds } = req.body

    console.log(req.body)

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

export const deleteChat = async (req: IRequestWithUser, res: Response) => {
    const { id } = req.params

    try {
        await prisma.message.deleteMany({
            where: {
              chatId: id,
            },
          });
      
          // Finally, delete the chat
          await prisma.chat.delete({
            where: {
              id: id,
            },
          });

        return res.json({ message: 'Chat deleted successfully', success: true })
    } catch (error) {
        console.log(error)

        return res.status(500).json({ message: 'Error deleting chat', success: false })
    }
}

export const getChatMessages = async (req: IRequestWithUser, res: Response) => {
    const { id } = req.params
    let { beforeId, limit } = req.query

    try {
        let messages
        if(beforeId?.length as number > 0) {  
            messages = await prisma.message.findMany({
                where: {
                    chatId: id,
                    ...(beforeId && { id: { lt: String(beforeId) } })
                },
                take: limit ? Number(limit) : 10,
                orderBy: {
                    createdAt: 'asc'
                },
                include: {
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

        } else {
            messages = await prisma.message.findMany({
                where: {
                    chatId: id
                },
                take: limit ? Number(limit) : 10,
                orderBy: {
                    createdAt: 'desc'
                },
                include: {
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

            messages = messages.reverse()
        }

        return res.json({ data: messages, success: true })
    } catch (error) {
        console.log(error)

        return res.status(500).json({ message: 'Error fetching messages', success: false })
    }
}