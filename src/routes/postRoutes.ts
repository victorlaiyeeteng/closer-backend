import { Router } from "express";
import { AppDataSource } from "../data-source";
import { Post} from "../entity/Post";
import { User } from "../entity/User";
import multer from "multer";
import { authenticate } from "../utils/auth";
import { uploadImage, getSignedUrl } from "../utils/cloudStorage";
import CustomRequest from "../types/request";


const router = Router();
const postRepository = AppDataSource.getRepository(Post);
const upload = multer({ storage: multer.memoryStorage() });


// Create post and (upload image)
router.post('/upload', authenticate, upload.single('image'), async (req: CustomRequest, res) => {
    if (!req.file) return res.status(400).json({ message: 'No image file uploaded' });

    const { title, caption } = req.body;
    const authenticatedUser = req.user as User;

    if (!title) return res.status(400).json({ message: 'Title is required' })

    try {
        // Upload image to Google Cloud Storage
        const filePath = await uploadImage(req.file);

        // Create a new post entry
        const post = postRepository.create({
            image: filePath,
            title,
            caption,
            user: authenticatedUser
        });

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

// Retrieve images uploaded
router.get('/posts', authenticate, async (req: CustomRequest, res) => {
    const authenticatedUser = req.user;
  
    try {
      const posts = await postRepository.find({ where: { user: authenticatedUser } });
  
      // Generate signed URLs for each post
      const postsWithSignedUrls = await Promise.all(
        posts.map(async (post) => {
          if (post.image) {
            const signedUrl = await getSignedUrl(post.image);
            return { ...post, imageUrl: signedUrl };
          }
          return post;
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

export default router;