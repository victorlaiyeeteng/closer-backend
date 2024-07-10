import { Router } from "express";
import { AppDataSource } from "../data-source";
import { Post} from "../entity/Post";
import { User } from "../entity/User";
import multer from "multer";
import { authenticate } from "../utils/auth";
import { uploadImage, getSignedUrl, deleteImageFromGCBucket } from "../utils/cloudStorage";
import CustomRequest from "../types/request";
import { convertToTimeZone } from "../utils/timezone";


const router = Router();
const postRepository = AppDataSource.getRepository(Post);
const userRepository = AppDataSource.getRepository(User);
const upload = multer({ storage: multer.memoryStorage() });


// Create post and (upload image)
router.post('/upload', authenticate, upload.single('image'), async (req: CustomRequest, res) => {
    const { title, caption } = req.body;
    const authenticatedUser = req.user as User;

    if (!title) return res.status(400).json({ message: 'Title is required' })

    try {
        // Upload image to Google Cloud Storage
        const filePath = req.file ? await uploadImage(req.file) : null;

        const postData : Partial<Post> = {
            title, caption, user: authenticatedUser
        }

        if (filePath) {
            postData.image = filePath;
        }

        const post = postRepository.create(postData);
        const savedPost = await postRepository.save(post);

        console.log("Successfully uploaded image and created post");
        res.status(201).json(savedPost);
    } catch (err) {
        if (err instanceof Error) {
            res.status(400).json({ message: err.message });
        } else {
            res.status(400).json({ message: 'An unknown error occurred.' });
            console.log("An unknown error occurred while uploading image and creating post.");
        }
    }
});

// Retrieve posts uploaded
router.get('/view', authenticate, async (req: CustomRequest, res) => {
    const authenticatedUser = req.user as User;
    const authenticatedUserData = await userRepository.findOne({ where: { username: authenticatedUser.username }, relations: ['partner']});
    if (!authenticatedUserData) return res.status(400).json({ message: 'User not found.' });
    if (!authenticatedUserData.partner) return res.status(400).json({ message: 'You do not have a partner to view posts.' });
  
    try {
      const userPosts = await postRepository.find({ where: { user: authenticatedUser }, relations: ['user'] });
      const partnerPosts = await postRepository.find({ where: { user: authenticatedUserData.partner}, relations: ['user'] });
      const allPosts = [...userPosts, ...partnerPosts];
  
      // Generate signed URLs for each post
      const postsWithSignedUrls = await Promise.all(
        allPosts.map(async (post) => {
            const signedUrl = post.image ? await getSignedUrl(post.image) : null;
            if (!authenticatedUserData.partner) return res.status(400).json({ message: 'You do not have a partner to view posts.' });
            const userTimestamp = convertToTimeZone(post.timestamp.toISOString(), authenticatedUserData.timezone);
            const partnerTimestamp = convertToTimeZone(post.timestamp.toISOString(), authenticatedUserData.partner.timezone);
            return {
                ...post, 
                imageUrl: signedUrl,
                userTimestamp, 
                partnerTimestamp,
                mine: authenticatedUser.id === post.user.id
            };
        })
      );
  
      res.json(postsWithSignedUrls);
    } catch (err) {
      if (err instanceof Error) {
        res.status(400).json({ message: err.message });
      } else {
        res.status(400).json({ message: 'An unknown error occurred.' });
        console.log("An unknown error occurred while retrieving posts.");
      }
    }
});

// Delete post
router.delete('/remove/:id', authenticate, async (req: CustomRequest, res) => {
  const postId = req.params.id;
  const authenticatedUser = req.user as User;

  try {
    const post = await postRepository.findOne({ where: { id: Number(postId), user: authenticatedUser } });
    if (!post) return res.status(404).json({ message: 'Post not found or you do not have permission to delete this post.' });

    if (post.image) {
      await deleteImageFromGCBucket(post.image);
    }
    await postRepository.remove(post);

    res.status(200).json({ message: 'Post deleted successfully.' });
  } catch (err) {
      if (err instanceof Error) {
          res.status(400).json({ message: err.message });
      } else {
          res.status(400).json({ message: 'An unknown error occurred.' });
          console.log("An unknown error occurred while deleting the post.");
      }
  }
});


export default router;