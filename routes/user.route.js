const router = require('express').Router()
const { getUsers, register, login, logout, getMe } = require('../controllers/user.controller');
const { accept } = require('../middleware/accept');
const { protect } = require('../middleware/auth');

router.route('/').get(accept, getUsers);

router.post('/register', accept, register);

router.post('/login', accept, login);

router.get('/logout', accept, logout);

router.get('/me', accept, protect, getMe);

module.exports = router;