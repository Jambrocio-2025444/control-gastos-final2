import { Pool } from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

export const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

export const initializeDatabase = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE;`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;`);
    console.log('Columnas de Google verificadas en users');

    const adminPassword = await bcrypt.hash('admin123', 10);
    const userPassword = await bcrypt.hash('user123', 10);

    await client.query(`
      INSERT INTO users (username, email, password_hash, role)
      VALUES 
        ('admin', 'admin@example.com', $1, 'admin'),
        ('user', 'user@example.com', $2, 'user')
      ON CONFLICT (username) DO NOTHING
    `, [adminPassword, userPassword]);

    console.log('Base de datos inicializada');

    // --- Módulo de Ingresos ---
    await client.query(`
      CREATE TABLE IF NOT EXISTS incomes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(20) NOT NULL CHECK (type IN ('fijo', 'variable', 'otro')),
        amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
        description VARCHAR(255) NOT NULL,
        income_date DATE NOT NULL,
        period VARCHAR(20) NOT NULL DEFAULT 'mes',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Tabla incomes verificada');

    // --- Módulo de Egresos ---
    await client.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        classification VARCHAR(20) NOT NULL CHECK (classification IN ('fijo', 'variable', 'deuda')),
        category VARCHAR(50) NOT NULL,
        amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
        description VARCHAR(255) NOT NULL,
        expense_date DATE NOT NULL,
        period VARCHAR(20) NOT NULL DEFAULT 'mes',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Tabla expenses verificada');

    await client.query(`
      ALTER TABLE expenses
      ADD COLUMN IF NOT EXISTS include_in_debt_health BOOLEAN NOT NULL DEFAULT true;
    `);

    // --- Módulo de Metas de Ahorro ---
    await client.query(`
      CREATE TABLE IF NOT EXISTS savings_goals (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        target_amount NUMERIC(12,2) NOT NULL CHECK (target_amount > 0),
        current_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (current_amount >= 0),
        status VARCHAR(20) NOT NULL DEFAULT 'activa' CHECK (status IN ('activa', 'completada')),
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP
      );
    `);
    console.log('Tabla savings_goals verificada');

  } catch (error) {
    console.error('Error al inicializar la base de datos:', error);
    throw error;
  } finally {
    client.release();
  }
};