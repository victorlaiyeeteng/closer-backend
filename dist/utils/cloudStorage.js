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
exports.uploadImage = void 0;
const storage_1 = require("@google-cloud/storage");
const path_1 = __importDefault(require("path"));
require("dotenv/config");
const storage = new storage_1.Storage({
    projectId: process.env.GCLOUD_PROJECT_ID,
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});
const bucket = storage.bucket(process.env.GCLOUD_STORAGE_BUCKET);
const uploadImage = (file) => __awaiter(void 0, void 0, void 0, function* () {
    const blob = bucket.file(Date.now() + path_1.default.extname(file.originalname));
    const blobStream = blob.createWriteStream({
        resumable: false,
    });
    return new Promise((resolve, reject) => {
        blobStream.on('error', reject);
        blobStream.on('finish', () => {
            resolve(blob.publicUrl());
        });
        blobStream.end(file.buffer);
    });
});
exports.uploadImage = uploadImage;
//# sourceMappingURL=cloudStorage.js.map