import Router from 'express'
import { getMe, loginUser, registerUser } from '../../controllers/auth/auth.controller';

const router = Router();

router.post('/login', (req, res) => loginUser(req, res))
router.post('/register', async (req, res) => registerUser(req, res));
router.get('/me', async (req, res) => getMe(req, res))

export default router;