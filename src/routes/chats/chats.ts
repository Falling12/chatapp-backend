import Router from 'express';
import { createNewChat, getUserChats } from '../../controllers/chats/chat.controller';

const router = Router();

router.get('/', async (req, res) => getUserChats(req, res))
router.post('/', async (req, res) => createNewChat(req, res))

export default router;