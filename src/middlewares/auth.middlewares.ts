import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { PrismaClient, User } from '@prisma/client'
import { IRequestWithUser } from '../../types'

const prisma = new PrismaClient()

export const authMiddleware = async (req: IRequestWithUser, res: Response, next: NextFunction) => {
    const token = req.headers.authorization

    if(!token) {
        return res.status(401).json({ message: 'Unauthorized', success: false })
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!)

        const user = await prisma.user.findUnique({
            where: {
                id: (decoded as any).id
            }
        })

        if(!user) {
            return res.status(401).json({ message: 'Unauthorized', success: false })
        }

        req.user! = {
            id: user.id,
            email: user.email,
            name: user.name
        } as User

        next()
    } catch (error) {
        return res.status(401).json({ message: 'Unauthorized', success: false })
    }
}