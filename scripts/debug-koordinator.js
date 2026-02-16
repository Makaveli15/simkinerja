const mysql = require('mysql2/promise');

(async () => {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'simkinerja'
  });

  try {
    console.log('=== All Validasi Kuantitas ===');
    const [v] = await pool.query('SELECT id, kegiatan_id, status, status_kesubag FROM validasi_kuantitas');
    v.forEach(r => console.log('ID:', r.id, 'kegiatan:', r.kegiatan_id, 'status:', r.status, 'kesubag:', r.status_kesubag));

    console.log('\n=== Kegiatan with tim_id ===');
    const [k] = await pool.query('SELECT id, tim_id, created_by FROM kegiatan WHERE id IN (SELECT DISTINCT kegiatan_id FROM validasi_kuantitas)');
    k.forEach(r => console.log('Kegiatan ID:', r.id, 'tim_id:', r.tim_id, 'created_by:', r.created_by));

    console.log('\n=== Koordinator users ===');
    const [u] = await pool.query("SELECT id, username, tim_id FROM users WHERE role = 'koordinator'");
    u.forEach(r => console.log('User ID:', r.id, 'username:', r.username, 'tim_id:', r.tim_id));

    console.log('\n=== Query same as API ===');
    // This is the same query as in koordinator API
    const timId = u.length > 0 ? u[0].tim_id : null;
    console.log('Koordinator tim_id:', timId);
    
    if (timId) {
      const [apiResult] = await pool.query(`
        SELECT vk.*, 
               k.nama as kegiatan_nama,
               k.satuan_output,
               k.target_output,
               u.nama_lengkap as pelaksana_nama
        FROM validasi_kuantitas vk
        JOIN kegiatan k ON vk.kegiatan_id = k.id
        LEFT JOIN users u ON k.created_by = u.id
        WHERE k.tim_id = ?
        ORDER BY vk.created_at DESC
      `, [timId]);
      console.log('API would return:', apiResult.length, 'records');
      apiResult.forEach(r => console.log('  -', r.id, r.kegiatan_nama, 'status:', r.status));
    }

  } catch (error) {
    console.error('Error:', error.message);
  }

  await pool.end();
})();
