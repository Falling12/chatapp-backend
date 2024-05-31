import Router from 'express';
import { getFriendRequests, getUserFriends, getPossibleFriends } from '../../controllers/user/friends.controller'

const router = Router();

router.get('/friends', (req, res) => getUserFriends(req, res))
router.get('/friend-requests', (req, res) => getFriendRequests(req, res))
router.get('/possible-friends', (req, res) => getPossibleFriends(req, res))

export default router;