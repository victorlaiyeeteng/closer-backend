import { Router } from 'express';
import { AppDataSource } from '../data-source';
import { User } from '../entity/User';
import { authenticate } from '../utils/auth';
import CustomRequest from '../types/request';
import { PartnerRequest } from '../entity/PartnerRequest';
import { In } from 'typeorm';

const router = Router();
const userRepository = AppDataSource.getRepository(User);
const partnerRequestRepository = AppDataSource.getRepository(PartnerRequest);

// Find partner by username
router.get('/:username', authenticate, async (req: CustomRequest, res) => {
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

// Send partner request
router.post('/request/:username', authenticate, async (req: CustomRequest, res) => {
    const { username } = req.params;
    const authenticatedUser = req.user as User;
    const authenticatedUserData = await userRepository.findOne({ where: { username: authenticatedUser.username }, relations: ['partner']});
    if (authenticatedUserData!.partner) return res.status(400).json({ message: 'You already have a partner.'});
    if (username === authenticatedUser.username) return res.status(400).json({ message: "This is your own username."});

    try {
        const requestee = await userRepository.findOne({ where: { username } , relations: ['partner']});
        if (!requestee) return res.status(404).json({ message: ' User not found '});
        if (requestee.partner) return res.status(400).json({ message: 'User already has a partner.'});

        const existingRequest = await partnerRequestRepository.findOne({
            where: { requester: authenticatedUser, requestee }
        });
        if (existingRequest) return res.status(400).json({ message: 'Request already sent.'});
        

        const partnerRequest = partnerRequestRepository.create({ requester: authenticatedUser, requestee });
        await partnerRequestRepository.save(partnerRequest);
        console.log(`${authenticatedUser.username} successfully sent request to ${requestee.username}`);
        res.status(201).json({ message: 'Request sent.' });
    } catch (err) {
        if (err instanceof Error) {
            res.status(400).json({ message: err.message });
        } else {
            res.status(400).json({ message: 'An unknown error occurred' });
        }
    }
})

// View partner requests
router.get('/requests/view', authenticate, async (req: CustomRequest, res) => {
    const authenticatedUser = req.user as User;

    try {
        const requests = await partnerRequestRepository.find({
            where: { requestee: authenticatedUser }, relations: ['requester', 'requestee']
        });
        const requesters = requests.map(request => request.requester);
        
        res.status(200).json(requesters);
    } catch (err) {
        if (err instanceof Error) {
            res.status(400).json({ message: err.message });
        } else {
            res.status(400).json({ message: 'An unknown error occurred' });
        }
    }
})

// Accept partner request
router.post('/accept/:username', authenticate, async (req: CustomRequest, res) => {
    const username = req.params.username;
    const authenticatedUser = req.user as User;

    try {
        const requester = await userRepository.findOne({ where: { username } });
        if (!requester) {
            return res.status(404).json({ message: 'User not found' });
        }

        const partnerRequest = await partnerRequestRepository.findOne({
            where: { requester, requestee: authenticatedUser }
        });

        if (!partnerRequest) {
            return res.status(404).json({ message: 'Partner request not found' });
        }

        // Set both users as partners
        authenticatedUser.partner = requester;
        requester.partner = authenticatedUser;

        await userRepository.save(authenticatedUser);
        await userRepository.save(requester);
        await partnerRequestRepository.remove(partnerRequest);

        res.status(200).json({ message: 'Partner request accepted' });
    } catch (err) {
        if (err instanceof Error) {
            res.status(400).json({ message: err.message });
        } else {
            res.status(400).json({ message: 'An unknown error occurred' });
        }
    }
})


export default router;

