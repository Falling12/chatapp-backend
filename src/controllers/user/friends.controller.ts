import { User } from "@prisma/client";
import { IRequestWithUser } from "../../../types";
import { PrismaClient } from "@prisma/client";
import { Response } from 'express';
import { Server } from "socket.io";

const prisma = new PrismaClient()

export const getUserFriends = async (req: IRequestWithUser, res: Response) => {
    const { id } = req.user as User;

    try {
        const friends = await prisma.user.findUnique({
            where: {
                id: id
            },
            select: {
                friends: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        })

        return res.json({ friends: friends?.friends, message: 'User friends fetched successfully', success: true })
    } catch (error) {
        return res.status(500).json({ message: 'Error fetching user friends', success: false })
    }
}

export const getFriendRequests = async (req: IRequestWithUser, res: Response) => {
    const { id } = req.user as User;

    try {
        const friendRequests = await prisma.friendRequest.findMany({
            where: {
                receiverId: id
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        })

        return res.json({ friendRequests, message: 'Friend requests fetched successfully', success: true })
    } catch (error) {
        return res.status(500).json({ message: 'Error fetching friend requests', success: false })
    }
}