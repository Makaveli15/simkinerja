const mysql = require('mysql2/promise');

async function testInsert() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'simkinerja'
  });

  try {
    // Check table structure
    const [cols] = await pool.query('DESCRIBE validasi_kuantitas');
    console.log('Columns:');
    cols.forEach(c => console.log(`  ${c.Field}: ${c.Type} (${c.Null}, Default: ${c.Default})`));

    // Test insert with kegiatan_id = 24 (the one with 500 responden)
    console.log('\n--- Testing INSERT with kegiatan_id = 24 ---');
    const [result] = await pool.query(
      'INSERT INTO validasi_kuantitas (kegiatan_id, jumlah_output, keterangan, status) VALUES (?, ?, ?, ?)',
      [24, 10, 'test', 'draft']
    );
    console.log('Insert ID:', result.insertId);

    // Delete test record
    await pool.query('DELETE FROM validasi_kuantitas WHERE id = ?', [result.insertId]);
    console.log('Test insert/delete successful!');

  } catch (e) {
    console.error('Error:', e.message);
    console.error('SQL State:', e.sqlState);
    console.error('Error Number:', e.errno);
  } finally {
    await pool.end();
  }
}

testInsert();
