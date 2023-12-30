import { PrismaClient } from "@prisma/client"
import type { Request, Response } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

export const registerUser = async (req: Request, res: Response) => {
    const { email, password, username } = req.body
    console.log(email)
    const saltRounds = 10
    let hash = ''

    try {
        hash = await bcrypt.hash(password, saltRounds)
    } catch (error) {
        return res.status(500).json({ error, message: 'Error hashing password', success: false })
    }

    try {
        const user = await prisma.user.create({
            data: {
                email: email,
                password: hash,
                name: username
            },
            select: {
                id: true,
                email: true,
                name: true
            }
        })

        return res.json({ user, message: 'User created successfully', success: true })
    } catch (error: any) {
        if(error.code === 'P2002') {
            return res.status(400).json({ message: 'Email already exists', success: false })
        }

        return res.status(500).json({ message: 'Error creating user', success: false })
    }
}

export const loginUser = async (req: Request, res: Response) => {
    const { email, password } = req.body

    try {
        // get the user by the email or username provided
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    {
                        email: email
                    },
                    {
                        name: email
                    }
                ]
            },
            select: {
                id: true,
                email: true,
                password: true,
                name: true
            }
        })

        if(!user) {
            return res.status(404).json({ message: 'User not found', success: false })
        }

        const match = await bcrypt.compare(password, user.password)

        if(!match) {
            return res.status(401).json({ message: 'Invalid credentials', success: false })
        }

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET!, { expiresIn: '1d' })

        const userObject = {
            id: user.id,
            email: user.email,
            name: user.name,
            token: token
        }

        return res.json({ message: 'User logged in successfully', success: true, user: userObject })
    } catch (error) {
        return res.status(500).json({ message: 'Error logging in user', success: false })
    }
}

export const getMe = async (req: Request, res: Response) => {
    const token = req.headers.authorization

    try {
        const decoded: any = jwt.verify(token!, process.env.JWT_SECRET!)

        const user = await prisma.user.findUnique({
            where: {
                id: decoded.id
            },
            select: {
                id: true,
                email: true,
                name: true
            }
        })

        return res.json({ user, message: 'User retrieved successfully', success: true })
    } catch (error) {
        return res.status(500).json({ message: 'Error retrieving user', success: false })
    }
}