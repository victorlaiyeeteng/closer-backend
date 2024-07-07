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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const data_source_1 = require("../data-source");
const Post_1 = require("../entity/Post");
const User_1 = require("../entity/User");
const multer_1 = __importDefault(require("multer"));
const auth_1 = require("../utils/auth");
const cloudStorage_1 = require("../utils/cloudStorage");
const router = (0, express_1.Router)();
const postRepository = data_source_1.AppDataSource.getRepository(Post_1.Post);
const userRepository = data_source_1.AppDataSource.getRepository(User_1.User);
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
// Create post and (upload image)
router.post('/upload', auth_1.authenticate, upload.single('image'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { title, caption } = req.body;
    const authenticatedUser = req.user;
    if (!title)
        return res.status(400).json({ message: 'Title is required' });
    try {
        // Upload image to Google Cloud Storage
        const filePath = req.file ? yield (0, cloudStorage_1.uploadImage)(req.file) : null;
        const postData = {
            title, caption, user: authenticatedUser
        };
        if (filePath) {
            postData.image = filePath;
        }
        const post = postRepository.create(postData);
        const savedPost = yield postRepository.save(post);
        console.log("Successfully uploaded image and created post");
        res.status(201).json(savedPost);
    }
    catch (err) {
        if (err instanceof Error) {
            res.status(400).json({ message: err.message });
        }
        else {
            res.status(400).json({ message: 'An unknown error occurred.' });
            console.log("An unknown error occurred while uploading image and creating post.");
        }
    }
}));
// Retrieve posts uploaded
router.get('/view', auth_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const authenticatedUser = req.user;
    const authenticatedUserData = yield userRepository.findOne({ where: { username: authenticatedUser.username }, relations: ['partner'] });
    if (!authenticatedUserData)
        return res.status(400).json({ message: 'User not found.' });
    if (!authenticatedUserData.partner)
        return res.status(400).json({ message: 'You do not have a partner to view posts.' });
    try {
        const userPosts = yield postRepository.find({ where: { user: authenticatedUser }, relations: ['user'] });
        const partnerPosts = yield postRepository.find({ where: { user: authenticatedUserData.partner }, relations: ['user'] });
        const allPosts = [...userPosts, ...partnerPosts];
        // Generate signed URLs for each post
        const postsWithSignedUrls = yield Promise.all(allPosts.map((post) => __awaiter(void 0, void 0, void 0, function* () {
            const signedUrl = post.image ? yield (0, cloudStorage_1.getSignedUrl)(post.image) : null;
            return Object.assign(Object.assign({}, post), { imageUrl: signedUrl, mine: authenticatedUser.id === post.user.id });
        })));
        res.json(postsWithSignedUrls);
    }
    catch (err) {
        if (err instanceof Error) {
            res.status(400).json({ message: err.message });
        }
        else {
            res.status(400).json({ message: 'An unknown error occurred.' });
            console.log("An unknown error occurred while retrieving posts.");
        }
    }
}));
// Delete post
router.delete('/remove/:id', auth_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const postId = req.params.id;
    const authenticatedUser = req.user;
    try {
        const post = yield postRepository.findOne({ where: { id: Number(postId), user: authenticatedUser } });
        if (!post)
            return res.status(404).json({ message: 'Post not found or you do not have permission to delete this post.' });
        if (post.image) {
            yield (0, cloudStorage_1.deleteImageFromGCBucket)(post.image);
        }
        yield postRepository.remove(post);
        res.status(200).json({ message: 'Post deleted successfully.' });
    }
    catch (err) {
        if (err instanceof Error) {
            res.status(400).json({ message: err.message });
        }
        else {
            res.status(400).json({ message: 'An unknown error occurred.' });
            console.log("An unknown error occurred while deleting the post.");
        }
    }
}));
exports.default = router;
//# sourceMappingURL=postRoutes.js.map