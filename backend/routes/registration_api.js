// routes/registration_api.js
const express = require('express');
const router = express.Router();
const winston = require('winston');
const { UsersModel } = require('../dao/userDao');
const { hashPasswordArgon2 } = require('../utils/PasswordUtils');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.Console()
    ]
});


// Registration route
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    try {
        const existingUser = await UsersModel.findOne({
            $or: [{ username }, { email }]
        });

        if (existingUser) {
            return res.status(409).json({ error: 'Username or email already exists' });
        }

        const hashedPassword = await hashPasswordArgon2(password);
        const user = new UsersModel({
            username,
            email,
            hashed_password: hashedPassword
        });

        await user.save();
        req.session.user = { id: user._id, username };
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
