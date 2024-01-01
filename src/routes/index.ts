import { Router } from "express";
import authRouter from "./auth/auth";
import chatRouter from "./chats/chats";
import userRouter from "./user/user";
import { authMiddleware } from "../middlewares/auth.middlewares";

const router = Router();

router.get('/', (req, res) => {
    res.send('/api')
});

router.use('/auth', authRouter)
router.use('/chats', authMiddleware, chatRouter)
router.use('/user', authMiddleware, userRouter)

export default router;