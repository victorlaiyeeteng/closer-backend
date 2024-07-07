import { AppDataSource } from "../data-source";
import { Post } from "../entity/Post";
import { LessThan } from "typeorm";
import cron from 'node-cron';
import 'dotenv/config';
import { deleteImageFromGCBucket } from "../utils/cloudStorage";


const postRepository = AppDataSource.getRepository(Post);

const cleanupOldPosts = async () : Promise<void> => {
    try {
        const cutOffDate = new Date();
        cutOffDate.setHours(cutOffDate.getHours() - 72);

        const oldPosts = await postRepository.find({
            where: {
                timestamp: LessThan(cutOffDate),
            }
        });

        for (const post of oldPosts) {
            if (post.image) {
                await deleteImageFromGCBucket(post.image);
            }
            await postRepository.remove(post);
        }

        console.log(`Cleaned up ${oldPosts.length} old posts, from '${cutOffDate}' and older.`);
    } catch (err) {
        console.error('Error cleaning up old posts:', err);
    }
}

// Schedule the job to run daily at midnight
cron.schedule('0 0 * * *', cleanupOldPosts);

export default cleanupOldPosts;