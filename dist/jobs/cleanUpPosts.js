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
const data_source_1 = require("../data-source");
const Post_1 = require("../entity/Post");
const typeorm_1 = require("typeorm");
const node_cron_1 = __importDefault(require("node-cron"));
require("dotenv/config");
const cloudStorage_1 = require("../utils/cloudStorage");
const postRepository = data_source_1.AppDataSource.getRepository(Post_1.Post);
const cleanupOldPosts = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const cutOffDate = new Date();
        cutOffDate.setHours(cutOffDate.getHours() - 72);
        const oldPosts = yield postRepository.find({
            where: {
                timestamp: (0, typeorm_1.LessThan)(cutOffDate),
            }
        });
        for (const post of oldPosts) {
            if (post.image) {
                yield (0, cloudStorage_1.deleteImageFromGCBucket)(post.image);
            }
            yield postRepository.remove(post);
        }
        console.log(`Cleaned up ${oldPosts.length} old posts, from '${cutOffDate}' and older.`);
    }
    catch (err) {
        console.error('Error cleaning up old posts:', err);
    }
});
// Schedule the job to run daily at midnight
node_cron_1.default.schedule('0 0 * * *', cleanupOldPosts);
exports.default = cleanupOldPosts;
//# sourceMappingURL=cleanUpPosts.js.map