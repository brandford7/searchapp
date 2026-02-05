// create-admin-simple.ts
import * as bcrypt from 'bcrypt';
import { Client } from 'pg';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function createAdmin() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database...');

    // Create UUID extension if not exists
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    // Create users table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        username VARCHAR UNIQUE NOT NULL,
        password VARCHAR,
        role VARCHAR NOT NULL DEFAULT 'temporary',
        "isActive" BOOLEAN DEFAULT true,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Users table ready');

    // Check if admin exists
    const existing = await client.query(
      'SELECT * FROM users WHERE username = $1',
      ['admin'],
    );

    if (existing.rows.length > 0) {
      console.log('❌ Admin user already exists!');
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('EddyKay@123', 10);

    // Insert admin
    await client.query(
      `INSERT INTO users (username, password, role, "isActive") 
       VALUES ($1, $2, $3, $4)`,
      ['admin', hashedPassword, 'admin', true],
    );

    console.log('✅ Admin user created successfully!');
    console.log('   Username: admin');
    console.log('   Password: Eddykay@123');
    console.log('   Role: admin');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

createAdmin();
