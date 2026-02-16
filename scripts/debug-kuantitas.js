const mysql = require('mysql2/promise');

(async () => {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'simkinerja'
  });

  try {
    // Check kegiatan kuantitas
    const [kegiatan] = await pool.query(
      "SELECT id, nama, created_by, jenis_validasi FROM kegiatan WHERE jenis_validasi = 'kuantitas'"
    );
    console.log('Kegiatan dengan jenis_validasi kuantitas:');
    kegiatan.forEach(k => console.log(`  ID: ${k.id}, created_by: ${k.created_by}, nama: ${k.nama}`));

    // Check users pelaksana
    const [users] = await pool.query(
      "SELECT id, username, nama_lengkap FROM users WHERE role = 'pelaksana'"
    );
    console.log('\nUsers pelaksana:');
    users.forEach(u => console.log(`  ID: ${u.id}, username: ${u.username}, nama: ${u.nama_lengkap}`));

    // Check validasi kuantitas yang sudah ada
    const [validasi] = await pool.query(
      "SELECT * FROM validasi_kuantitas ORDER BY id DESC LIMIT 5"
    );
    console.log('\nValidasi kuantitas terakhir:');
    validasi.forEach(v => console.log(`  ID: ${v.id}, kegiatan_id: ${v.kegiatan_id}, jumlah: ${v.jumlah_output}, status: ${v.status}`));

  } catch (error) {
    console.error('Error:', error.message);
  }

  await pool.end();
})();
