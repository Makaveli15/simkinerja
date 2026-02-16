const mysql = require('mysql2/promise');

(async () => {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'simkinerja'
  });

  try {
    // 1. Check kegiatan ID 24 - jenis_validasi
    const [kegiatan] = await pool.query(
      "SELECT id, nama, jenis_validasi, satuan_output, tim_id, created_by FROM kegiatan WHERE id = 24"
    );
    console.log('=== Kegiatan ID 24 ===');
    console.log(JSON.stringify(kegiatan[0], null, 2));

    // 2. Check validasi kuantitas for kegiatan 24
    const [validasi] = await pool.query(
      "SELECT * FROM validasi_kuantitas WHERE kegiatan_id = 24"
    );
    console.log('\n=== Validasi Kuantitas for Kegiatan 24 ===');
    console.log('Total records:', validasi.length);
    validasi.forEach((v, i) => {
      console.log(`Record ${i+1}:`, {
        id: v.id, 
        jumlah: parseFloat(v.jumlah_output), 
        status: v.status,
        bukti: v.bukti_path ? 'yes' : 'no'
      });
    });

    // 3. Check user who created kegiatan
    const [user] = await pool.query(
      "SELECT id, username, role, tim_id FROM users WHERE id = ?",
      [kegiatan[0].created_by]
    );
    console.log('\n=== Creator User ===');
    console.log(JSON.stringify(user[0], null, 2));

    // 4. Check if tim_id matches
    console.log('\n=== TIM Check ===');
    console.log('Kegiatan tim_id:', kegiatan[0].tim_id);
    console.log('User tim_id:', user[0].tim_id);
    console.log('Match:', kegiatan[0].tim_id === user[0].tim_id);

  } catch (error) {
    console.error('Error:', error.message);
  }

  await pool.end();
})();
