const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function createKesubag() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'simkinerja'
  });

  try {
    const password = 'kesubag123';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    await connection.execute(
      `INSERT INTO users (username, email, nama_lengkap, password, role, status) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      ['kesubag', 'kesubag@bps.go.id', 'Kepala Sub Bagian', hashedPassword, 'kesubag', 'aktif']
    );
    
    console.log('=== Akun Kesubag Berhasil Dibuat ===');
    console.log('Username: kesubag');
    console.log('Password: kesubag123');
    console.log('Role: kesubag');
    
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      console.log('Akun kesubag sudah ada');
    } else {
      console.error('Error:', error);
    }
  } finally {
    await connection.end();
  }
}

createKesubag();
