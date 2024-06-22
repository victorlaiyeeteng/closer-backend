import { Router } from 'express';
import { AppDataSource } from '../data-source';
import { User } from '../entity/User';
import { hashPassword, authenticate, verifyPassword, generateToken } from '../utils/auth';
import CustomRequest from '../types/request';

const router = Router();
const userRepository = AppDataSource.getRepository(User);

// Create user account
router.post('/register', async (req: CustomRequest, res) => {
    const { username, displayName, password, bio, profilePicture } = req.body;

    const hashedPassword = await hashPassword(password);
    const user = userRepository.create({ username, displayName, password: hashedPassword, bio, profilePicture});

    try {
        const savedUser = await userRepository.save(user);
        console.log("Successfully added user.");
        res.status(201).json(savedUser);
    } catch (err) {
        if (err instanceof Error) {
            res.status(400).json({ message: err.message });
        } else {
            res.status(400).json({ message: 'An unknown error occurred.' })
        }
        console.log("Error occurred while registering new user.");
    }
});

// Login user and generate JWT token
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await userRepository.findOne({ where: { username } });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isPasswordValid = await verifyPassword(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid password' });
        }

        const token = generateToken(user);
        res.json({ token });
        console.log(`Successfully logged in as ${username}`);
    } catch (err) {
        if (err instanceof Error) {
            res.status(400).json({ message: err.message });
        } else {
            res.status(400).json({ message: 'An unknown error occurred.' });
        }
        console.log("Error occurred while logging in.");
    }
});

// Find partner by username
router.get('/partner/:username', authenticate, async (req: CustomRequest, res) => {
    const { username } = req.params;
    const authenticatedUser = req.user as User;

    if (username === authenticatedUser.username) {
        console.log("Error occurred while finding user.");
        return res.status(400).json({ message: "This is your own username."});
    }

    try {
        const user = await userRepository.findOne({ where: { username }});
        if (!user) {
            return res.status(404).json({ message: ' User not found '});
        }
        console.log(`Successfully found user: ${username}.`);
        res.json(user);
    } catch (err) {
        if (err instanceof Error) {
            res.status(400).json({ message: err.message });
        } else {
            res.status(400).json({ message: 'An unknown error occurred.' });
        }
        console.log("Error occurred while finding user.");
    }
})

export default router;