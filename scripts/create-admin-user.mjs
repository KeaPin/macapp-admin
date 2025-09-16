import { Pool } from "pg";
import bcrypt from "bcryptjs";
import { config } from "dotenv";

// Load environment variables
config();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.HYPERDRIVE_CONNECTION_STRING,
});

// Generate user ID (32-character string)
function generateUserId() {
  const chars = "0123456789abcdefghijklmnopqrstuvwxyz";
  let result = "";
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function createAdminUser() {
  const client = await pool.connect();
  
  try {
    // Check if admin user already exists
    const existingUser = await client.query(
      'SELECT id FROM "user" WHERE user_name = $1',
      ['admin']
    );

    if (existingUser.rows.length > 0) {
      console.log('✅ Admin user already exists');
      return;
    }

    // Create admin user
    const userId = generateUserId();
    const password = 'admin123'; // Default password
    const hashedPassword = await bcrypt.hash(password, 12);

    await client.query(
      `INSERT INTO "user" (id, user_name, password, email, role, status, create_time) 
       VALUES ($1, $2, $3, $4, $5, $6, now())`,
      [userId, 'admin', hashedPassword, 'admin@example.com', 'admin', 'NORMAL']
    );

    console.log('🎉 Admin user created successfully!');
    console.log('📋 Login credentials:');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('⚠️  Please change the password after first login!');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  console.log('🚀 Creating admin user...');
  
  try {
    await createAdminUser();
  } catch (error) {
    console.error('💥 Failed to create admin user:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
