"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const data_source_1 = require("../data-source");
const User_1 = require("../entity/User");
const auth_1 = require("../utils/auth");
const router = (0, express_1.Router)();
const userRepository = data_source_1.AppDataSource.getRepository(User_1.User);
// Create user account
router.post('/register', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, displayName, password, bio, profilePicture } = req.body;
    const hashedPassword = yield (0, auth_1.hashPassword)(password);
    const user = userRepository.create({ username, displayName, password: hashedPassword, bio, profilePicture });
    try {
        const savedUser = yield userRepository.save(user);
        console.log("Successfully added user.");
        res.status(201).json(savedUser);
    }
    catch (err) {
        if (err instanceof Error) {
            res.status(400).json({ message: err.message });
        }
        else {
            res.status(400).json({ message: 'An unknown error occurred.' });
        }
        console.log("Error occurred while registering new user.");
    }
}));
// Find partner by username
router.get('/partner/:username', auth_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username } = req.params;
    const authenticatedUser = req.user;
    if (username === authenticatedUser.username) {
        console.log("Error occurred while finding user.");
        return res.status(400).json({ message: "This is your own username." });
    }
    try {
        const user = yield userRepository.findOne({ where: { username } });
        if (!user) {
            return res.status(404).json({ message: ' User not found ' });
        }
        console.log(`Successfully found user: ${username}.`);
        res.json(user);
    }
    catch (err) {
        if (err instanceof Error) {
            res.status(400).json({ message: err.message });
        }
        else {
            res.status(400).json({ message: 'An unknown error occurred.' });
        }
        console.log("Error occurred while finding user.");
    }
}));
exports.default = router;
//# sourceMappingURL=userRoutes.js.map