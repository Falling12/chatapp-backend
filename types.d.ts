import { User } from "@prisma/client";
import { Request } from "express";
import { Socket } from "socket.io";

export interface IRequestWithUser extends Request {
    user?: User;
}

export interface ISocket extends Socket {
    user: User
}