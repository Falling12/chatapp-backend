import Router from 'express';
import { getUserChats } from '../../controllers/chats/chat.controller';

const router = Router();

router.get('/', async (req, res) => getUserChats(req, res))

export default router;