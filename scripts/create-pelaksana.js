const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function createPelaksana() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'simkinerja',
  });

  const username = process.argv[2] || 'pelaksana1';
  const email = process.argv[3] || 'pelaksana1@bps.go.id';
  const password = process.argv[4] || 'BPS5305';

  try {
    // Check if user already exists
    const [existing] = await connection.execute(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existing.length > 0) {
      console.log('❌ User sudah ada dengan username atau email tersebut');
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await connection.execute(
      'INSERT INTO users (username, email, password, role, status) VALUES (?, ?, ?, ?, ?)',
      [username, email, hashedPassword, 'pelaksana', 'active']
    );

    console.log('✅ User pelaksana berhasil dibuat!');
    console.log(`   Username: ${username}`);
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Role: pelaksana`);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

createPelaksana();
