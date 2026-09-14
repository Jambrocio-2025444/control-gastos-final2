import { UserModel } from '../models/user.model';
import { generateToken } from '../config/jwt';
import { LoginResponse, LoginRequest } from '../types';
import { OAuth2Client } from 'google-auth-library';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export class AuthService {
  static async login(credentials: LoginRequest): Promise<LoginResponse | null> {
    const { username, password } = credentials;
    
    const user = await UserModel.validatePassword(username, password);
    if (!user) return null;

    const token = generateToken({
      id: user.id,
      username: user.username,
      role: user.role,
    });

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar_url: user.avatar_url,
      },
    };
  }

  static async getUserById(id: number) {
    return await UserModel.findById(id);
  }

  static async loginWithGoogle(credential: string): Promise<LoginResponse> {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw new Error('Token de Google inválido');
    }

    let user = await UserModel.findByEmail(payload.email);

    if (!user) {
      const baseUsername = payload.email.split('@')[0];
      const username = await UserModel.generateUniqueUsername(baseUsername);
      user = await UserModel.createGoogleUser({
        username,
        email: payload.email,
        googleId: payload.sub,
        avatarUrl: payload.picture,
      });
    } else {
      if (!user.google_id) {
        user = (await UserModel.linkGoogleId(user.id, payload.sub)) ?? user;
      }
      if (payload.picture && user.avatar_url !== payload.picture) {
        user = (await UserModel.updateAvatar(user.id, payload.picture)) ?? user;
      }
    }

    const token = generateToken({ id: user.id, username: user.username, role: user.role });

    return {
      token,
      user: { 
        id: user.id, 
        username: user.username, 
        email: user.email, 
        role: user.role, 
        avatar_url: user.avatar_url 
      },
    };
  }
}