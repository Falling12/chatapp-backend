import Router from 'express';
import { getFriendRequests, getUserFriends } from '../../controllers/user/friends.controller'

const router = Router();

router.get('/friends', (req, res) => getUserFriends(req, res))
router.get('/friend-requests', (req, res) => getFriendRequests(req, res))

export default router;