import { pool } from '../config/database';
import { User } from '../types';
import bcrypt from 'bcryptjs';

export class UserModel {
  static async findByUsername(username: string): Promise<User | null> {
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );
    return result.rows[0] || null;
  }


  static async findById(id: number): Promise<Omit<User, 'password_hash'> | null> {
    const result = await pool.query(
      'SELECT id, username, email, role, created_at, updated_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  static async validatePassword(username: string, password: string): Promise<User | null> {
    const user = await this.findByUsername(username);
    if (!user) return null;
    
    const isValid = await bcrypt.compare(password, user.password_hash);
    return isValid ? user : null;
  }

  static async findByEmail(email: string) {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0] || null;
}

static async createGoogleUser(data: { username: string; email: string; googleId: string; avatarUrl?: string }) {
  const result = await pool.query(
    `INSERT INTO users (username, email, password_hash, role, google_id, avatar_url)
     VALUES ($1, $2, NULL, 'user', $3, $4)
     RETURNING *`,
    [data.username, data.email, data.googleId, data.avatarUrl || null]
  );
  return result.rows[0];
}


static async linkGoogleId(userId: number, googleId: string) {
  const result = await pool.query(
    `UPDATE users SET google_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
    [googleId, userId]
  );
  return result.rows[0] || null;
}

static async generateUniqueUsername(base: string): Promise<string> {
  let candidate = base;
  let suffix = 0;
  while (await this.findByUsername(candidate)) {
    suffix += 1;
    candidate = `${base}${suffix}`;
  }
  return candidate;
}

static async updateAvatar(userId: number, avatarUrl: string) {
  const result = await pool.query(
    `UPDATE users SET avatar_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
    [avatarUrl, userId]
  );
  return result.rows[0] || null;
}
}