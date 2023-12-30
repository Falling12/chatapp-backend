import { Router } from "express";
import authRouter from "./auth/auth";
import chatRouter from "./chats/chats";
import { authMiddleware } from "../middlewares/auth.middlewares";

const router = Router();

router.get('/', (req, res) => {
    res.send('/api')
});

router.use('/auth', authRouter)
router.use('/chats', authMiddleware, chatRouter)

export default router;