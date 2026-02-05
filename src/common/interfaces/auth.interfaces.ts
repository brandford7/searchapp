import { Request } from 'express';
import { User } from '../../users/entities/user.entity';

// Extend the Express Request to include our User entity
export interface RequestWithUser extends Request {
  user: User;
}

export interface GoogleUser {
  email: string;
  firstName: string;
  lastName: string;
  picture: string;
  accessToken: string;
}

export interface JwtPayload {
  username: string;
  sub: string;
  roles: string[]; // These are just the names: ['admin', 'user']
}

// This is what req.user will look like
export interface ActiveUser {
  userId: string;
  email: string;
  roles: string[];
}
