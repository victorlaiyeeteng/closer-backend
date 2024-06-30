import { User } from '../entity/User';

declare module 'express' {
  interface Request {
      user?: User; // Define user property of type User or undefined
  }
}