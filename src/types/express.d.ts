import { User } from '../entity/User';

// declare global {
//   namespace Express {
//     interface Request {
//       user?: User;
//     }
//   }
// }

declare module 'express' {
  interface Request {
      user?: User; // Define user property of type User or undefined
  }
}