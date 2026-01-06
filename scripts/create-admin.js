const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

(async () => {
  const [, , username, email, password] = process.argv;

  if (!username || !email || !password) {
    console.log('Usage: node scripts/create-admin.js <username> <email> <password>');
    process.exit(1);
  }

  const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || 'localhost',
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'simkinerja',
  });

  try {
    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
      'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
      [username, email, hash, 'admin']
    );

    console.log('Admin user created. InsertId:', result.insertId || result[0]?.insertId);
  } catch (err) {
    console.error('Error creating admin:', err.message || err);
  } finally {
    await pool.end();
  }
})();
