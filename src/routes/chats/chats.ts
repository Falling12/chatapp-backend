import Router from 'express';
import { createNewChat, getUserChats, deleteChat, getChatMessages } from '../../controllers/chats/chat.controller';

const router = Router();

router.get('/', async (req, res) => getUserChats(req, res))
router.get('/:id', async (req, res) => getChatMessages(req, res))
router.post('/', async (req, res) => createNewChat(req, res))
router.delete('/:id', async (req, res) => deleteChat(req, res))

export default router; 