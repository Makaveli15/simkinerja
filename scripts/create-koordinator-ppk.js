/**
 * Script untuk membuat user Koordinator dan PPK
 * Jalankan dengan: node scripts/create-koordinator-ppk.js
 */

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'simkinerja'
};

async function createKoordinatorPPK() {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    console.log('Connecting to database...');
    
    // Get all teams
    const [teams] = await connection.execute('SELECT id, nama FROM tim');
    console.log(`Found ${teams.length} teams`);

    // Hash password
    const koordinatorPassword = await bcrypt.hash('koordinator123', 10);
    const ppkPassword = await bcrypt.hash('ppk123', 10);

    // Create koordinator for each team
    console.log('\nCreating Koordinator users...');
    for (const team of teams) {
      const username = `koordinator_${team.nama.toLowerCase().replace(/\s+/g, '_')}`;
      const email = `${username}@bps.go.id`;
      const nama = `Koordinator ${team.nama}`;
      const nip = `19900101202001${team.id.toString().padStart(4, '0')}`;

      try {
        // Check if user exists
        const [existing] = await connection.execute(
          'SELECT id FROM users WHERE username = ?',
          [username]
        );

        if (existing.length > 0) {
          // Update existing user
          await connection.execute(
            `UPDATE users SET 
              nama = ?, password = ?, role = 'koordinator', 
              email = ?, jabatan = 'Koordinator Tim', tim_id = ?
            WHERE username = ?`,
            [nama, koordinatorPassword, email, team.id, username]
          );
          console.log(`  Updated: ${username} (Tim: ${team.nama})`);
        } else {
          // Insert new user
          await connection.execute(
            `INSERT INTO users (nama, username, password, role, email, nip, jabatan, tim_id, created_at)
            VALUES (?, ?, ?, 'koordinator', ?, ?, 'Koordinator Tim', ?, NOW())`,
            [nama, username, koordinatorPassword, email, nip, team.id]
          );
          console.log(`  Created: ${username} (Tim: ${team.nama})`);
        }
      } catch (err) {
        console.error(`  Error creating koordinator for ${team.nama}:`, err.message);
      }
    }

    // Create PPK user
    console.log('\nCreating PPK user...');
    try {
      const [existingPPK] = await connection.execute(
        'SELECT id FROM users WHERE username = ?',
        ['ppk']
      );

      if (existingPPK.length > 0) {
        await connection.execute(
          `UPDATE users SET 
            nama = 'Pejabat Pembuat Keputusan', password = ?, role = 'ppk',
            email = 'ppk@bps.go.id', jabatan = 'PPK'
          WHERE username = 'ppk'`,
          [ppkPassword]
        );
        console.log('  Updated: ppk');
      } else {
        await connection.execute(
          `INSERT INTO users (nama, username, password, role, email, nip, jabatan, created_at)
          VALUES ('Pejabat Pembuat Keputusan', 'ppk', ?, 'ppk', 'ppk@bps.go.id', '198501012015011001', 'PPK', NOW())`,
          [ppkPassword]
        );
        console.log('  Created: ppk');
      }
    } catch (err) {
      console.error('  Error creating PPK:', err.message);
    }

    // Show all created users
    console.log('\n=== Created Users ===');
    const [users] = await connection.execute(
      `SELECT id, nama, username, role, tim_id, jabatan 
       FROM users 
       WHERE role IN ('koordinator', 'ppk')
       ORDER BY role, tim_id`
    );

    console.log('\nKoordinator Users:');
    users.filter(u => u.role === 'koordinator').forEach(u => {
      console.log(`  - ${u.username} | ${u.nama} | Tim ID: ${u.tim_id}`);
    });

    console.log('\nPPK Users:');
    users.filter(u => u.role === 'ppk').forEach(u => {
      console.log(`  - ${u.username} | ${u.nama}`);
    });

    console.log('\n=== Login Credentials ===');
    console.log('Koordinator: koordinator_[nama_tim] / koordinator123');
    console.log('PPK: ppk / ppk123');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
    console.log('\nDone!');
  }
}

createKoordinatorPPK();
