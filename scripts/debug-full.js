const mysql = require('mysql2/promise');

(async () => {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'simkinerja'
  });

  try {
    // 1. Check all users with roles
    console.log('=== ALL USERS ===');
    const [users] = await pool.query("SELECT id, username, role, tim_id FROM users");
    users.forEach(u => console.log(`ID: ${u.id}, username: ${u.username}, role: ${u.role}, tim_id: ${u.tim_id}`));

    // 2. Check validasi_kuantitas with all related data
    console.log('\n=== VALIDASI KUANTITAS with JOIN ===');
    const [vk] = await pool.query(`
      SELECT vk.id, vk.kegiatan_id, vk.status, vk.status_kesubag,
             k.nama as kegiatan_nama, k.tim_id,
             u.nama_lengkap as pelaksana_nama
      FROM validasi_kuantitas vk
      JOIN kegiatan k ON vk.kegiatan_id = k.id
      LEFT JOIN users u ON k.created_by = u.id
    `);
    vk.forEach(v => console.log(JSON.stringify(v)));

    // 3. Test with specific tim_id = 1
    console.log('\n=== FILTER BY TIM_ID = 1 ===');
    const [filtered] = await pool.query(`
      SELECT vk.id, vk.status, k.nama
      FROM validasi_kuantitas vk
      JOIN kegiatan k ON vk.kegiatan_id = k.id
      WHERE k.tim_id = 1
    `);
    console.log('Found:', filtered.length, 'records');
    filtered.forEach(f => console.log('  -', f.id, f.nama, f.status));

  } catch (error) {
    console.error('Error:', error.message);
  }

  await pool.end();
})();
