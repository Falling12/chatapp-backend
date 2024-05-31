import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const verifyToken = async (token: string) => {
    try {
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);

        const user = await prisma.user.findUnique({
            where: {
                id: decoded.id
            },
            select: {
                id: true,
                email: true,
                name: true,
                imageUrl: true
            }
        })

        return user;
    } catch (error) {
        return null;
    }
}