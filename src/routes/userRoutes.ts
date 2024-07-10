import { Router } from 'express';
import { AppDataSource } from '../data-source';
import { User } from '../entity/User';
import { hashPassword, verifyPassword, generateToken, authenticate } from '../utils/auth';
import CustomRequest from '../types/request';

const router = Router();
const userRepository = AppDataSource.getRepository(User);

// Create user account
router.post('/register', async (req: CustomRequest, res) => {
    const { username, displayName, password, bio, timezone } = req.body;

    const hashedPassword = await hashPassword(password);
    const user = userRepository.create({ username, displayName, password: hashedPassword, bio, timezone});

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

// Update user details
router.put('/update', authenticate, async (req: CustomRequest, res) => {
    const { displayName, bio, timezone } = req.body;
    const authenticatedUser = req.user as User;

    try {
        const user = await userRepository.findOne({ where: { id: authenticatedUser.id } });
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        user.displayName = displayName || user.displayName;
        user.bio = bio || user.bio;
        user.timezone = timezone || user.timezone;

        const updatedUser = await userRepository.save(user);
        res.json(updatedUser);
    } catch (error) {
        res.status(400).json({ message: 'Error updating user profile.', error });
    }
})

export default router;