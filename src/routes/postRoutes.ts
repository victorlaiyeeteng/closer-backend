import { Router } from "express";
import { AppDataSource } from "../data-source";
import { Post} from "../entity/Post";
import { User } from "../entity/User";
import multer from "multer";
import { authenticate } from "../utils/auth";
import { uploadImage, getSignedUrl, deleteImageFromGCBucket } from "../utils/cloudStorage";
import CustomRequest from "../types/request";
import { convertToTimeZone } from "../utils/timezone";
import { redisClient } from "../index";
import sharp from "sharp";


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

        // Save post to Redis cache
        const imageBuffer = req.file ? req.file.buffer : null;
				if (imageBuffer) {
					const compressedImageBuffer = await sharp(imageBuffer)
						.jpeg({ quality: 90 })
						.toBuffer();
						await redisClient.set(
							`post_image:${savedPost.id}`, 
							compressedImageBuffer.toString('binary'),
							{ EX: 24 * 60 * 60 }
						);
				}
				await redisClient.set(
					`post:${savedPost.id}`, 
					JSON.stringify({ ...savedPost }), 
					{ EX: 24 * 60 * 60 }
				);
        

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

// Retrieve recent posts from Redis
router.get('/view/recent', authenticate, async (req: CustomRequest, res) => {
  try {
		const authenticatedUser = req.user as User;
		const authenticatedUserData = await userRepository.findOne({ where: { username: authenticatedUser.username }, relations: ['partner']});
		if (!authenticatedUserData) return res.status(400).json({ message: 'You are not authenticated.' });
		if (!authenticatedUserData.partner) return res.status(400).json({ message: 'You do not have a partner to view posts.' });
		const userId = authenticatedUser.id;
		const partnerId = authenticatedUserData.partner.id;

    const keys = await redisClient.keys('post:*');
    const filteredPosts = await Promise.all(
      keys.map(async (key) => {
        const postData = await redisClient.get(key);
				const post = JSON.parse(postData!);
				if (post.user.id === userId || post.user.id === partnerId) {
					return {
						...post, 
						imageUrl: post.image ? `/post/view/image/${userId}/${post.id}` : null
					};
				}
				return null;
      })
    );

    const postsWithImageUrl = filteredPosts.filter(post => post !== null);

    res.json(postsWithImageUrl);
  } catch (err) {
    console.log('Error retrieving recent posts from Redis: ', err);
    res.status(500).json({ message: 'Failed to retrieve recent posts (Redis).' });
  }
});

// Serve the image in binary format
router.get('/view/image/:userId/:postId', authenticate, async (req: CustomRequest, res) => {
  try {
    const {userId, postId} = req.params;
		const authenticatedUser = req.user as User;
		const authenticatedUserData = await userRepository.findOne({ where: { username: authenticatedUser.username }, relations: ['partner']});
		if (!authenticatedUserData) return res.status(400).json({ message: 'You are not authenticated.' });
		if (authenticatedUserData.id !== Number(userId)) return res.status(400).json({ message: 'You are not authorized to view this image. '});

    // Retrieve the binary image data from Redis
    const imageString = await redisClient.get(`post_image:${postId}`);

    if (!imageString) {
      return res.status(404).json({ message: 'Image not found.' });
    }
		const imageBuffer = Buffer.from(imageString, 'binary');

    // Set the appropriate content type for the image (JPEG in this case)
    res.set('Content-Type', 'image/jpeg');
    res.send(imageBuffer); // Send the binary image data
  } catch (err) {
    console.log('Error retrieving image from Redis: ', err);
    res.status(500).json({ message: 'Failed to retrieve image.' });
  }
});

// Retrieve posts uploaded from DB (older)
router.get('/view/all', authenticate, async (req: CustomRequest, res) => {
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