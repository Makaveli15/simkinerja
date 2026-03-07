const mysql = require('mysql2/promise');

async function debugAutoComplete() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'simkinerja'
  });

  try {
    console.log('\n=== DEBUG AUTO-COMPLETE ===\n');

    // 1. Cek kegiatan berjalan
    const [kegiatan] = await pool.query(`
      SELECT id, nama, status, target_output, output_realisasi, anggaran_pagu, jenis_validasi, satuan_output
      FROM kegiatan 
      WHERE status = 'berjalan'
    `);
    console.log('1. Kegiatan Berjalan:');
    kegiatan.forEach(k => {
      console.log(`   ID: ${k.id}, Nama: ${k.nama}`);
      console.log(`   Target: ${k.target_output}, Output Realisasi: ${k.output_realisasi}`);
      console.log(`   Anggaran Pagu: ${k.anggaran_pagu}, Jenis: ${k.jenis_validasi || k.satuan_output}`);
      console.log('');
    });

    // 2. Cek validasi kuantitas disahkan
    const [validasi] = await pool.query(`
      SELECT kegiatan_id, SUM(jumlah_output) as total_output, COUNT(*) as jumlah_validasi
      FROM validasi_kuantitas 
      WHERE status = 'disahkan'
      GROUP BY kegiatan_id
    `);
    console.log('2. Validasi Kuantitas Disahkan (per kegiatan):');
    validasi.forEach(v => {
      console.log(`   Kegiatan ID: ${v.kegiatan_id}, Total Output: ${v.total_output}, Jumlah Validasi: ${v.jumlah_validasi}`);
    });
    console.log('');

    // 3. Cek realisasi anggaran
    const [anggaran] = await pool.query(`
      SELECT kegiatan_id, SUM(jumlah) as total_realisasi
      FROM realisasi_anggaran
      GROUP BY kegiatan_id
    `);
    console.log('3. Realisasi Anggaran (per kegiatan):');
    anggaran.forEach(a => {
      console.log(`   Kegiatan ID: ${a.kegiatan_id}, Total Realisasi: ${a.total_realisasi}`);
    });
    console.log('');

    // 4. Cek kendala open
    const [kendala] = await pool.query(`
      SELECT kegiatan_id, COUNT(*) as total_open
      FROM kendala_kegiatan 
      WHERE status = 'open'
      GROUP BY kegiatan_id
    `);
    console.log('4. Kendala Open (per kegiatan):');
    if (kendala.length === 0) {
      console.log('   Tidak ada kendala open');
    } else {
      kendala.forEach(k => {
        console.log(`   Kegiatan ID: ${k.kegiatan_id}, Kendala Open: ${k.total_open}`);
      });
    }
    console.log('');

    // 5. Analisis per kegiatan berjalan
    console.log('5. Analisis Kondisi Auto-Complete:');
    for (const k of kegiatan) {
      const targetOutput = parseFloat(k.target_output) || 0;
      const anggaranPagu = parseFloat(k.anggaran_pagu) || 0;
      
      // Cari validasi untuk kegiatan ini
      const vk = validasi.find(v => v.kegiatan_id === k.id);
      const outputTervalidasi = vk ? parseFloat(vk.total_output) : 0;
      
      // Cari realisasi anggaran
      const ra = anggaran.find(a => a.kegiatan_id === k.id);
      const totalRealisasi = ra ? parseFloat(ra.total_realisasi) : 0;
      
      // Cari kendala open
      const kd = kendala.find(x => x.kegiatan_id === k.id);
      const kendalaOpen = kd ? parseInt(kd.total_open) : 0;
      
      // Hitung serapan
      const serapanPersen = anggaranPagu > 0 ? (totalRealisasi / anggaranPagu) * 100 : 100;
      
      // Cek kondisi
      const isOutputComplete = outputTervalidasi >= targetOutput;
      const isKendalaResolved = kendalaOpen === 0;
      const isAnggaranTercapai = anggaranPagu <= 0 || serapanPersen >= 50;
      const canAutoComplete = isOutputComplete && isKendalaResolved && isAnggaranTercapai;
      
      console.log(`\n   --- Kegiatan ID: ${k.id} (${k.nama}) ---`);
      console.log(`   Target Output: ${targetOutput}`);
      console.log(`   Output Tervalidasi: ${outputTervalidasi} ${isOutputComplete ? '✅' : '❌'}`);
      console.log(`   Kendala Open: ${kendalaOpen} ${isKendalaResolved ? '✅' : '❌'}`);
      console.log(`   Anggaran Pagu: ${anggaranPagu}`);
      console.log(`   Realisasi Anggaran: ${totalRealisasi}`);
      console.log(`   Serapan: ${serapanPersen.toFixed(2)}% ${isAnggaranTercapai ? '✅' : '❌'}`);
      console.log(`   CAN AUTO-COMPLETE: ${canAutoComplete ? '✅ YA' : '❌ TIDAK'}`);
      
      // Update output_realisasi jika belum sinkron
      if (outputTervalidasi > 0 && k.output_realisasi != outputTervalidasi) {
        console.log(`\n   >>> FIXING: Update output_realisasi dari ${k.output_realisasi} ke ${outputTervalidasi}`);
        await pool.query('UPDATE kegiatan SET output_realisasi = ? WHERE id = ?', [outputTervalidasi, k.id]);
        console.log(`   >>> DONE: output_realisasi updated`);
      }
      
      // Auto-complete jika memenuhi syarat
      if (canAutoComplete) {
        console.log(`\n   >>> AUTO-COMPLETING kegiatan...`);
        await pool.query(`
          UPDATE kegiatan 
          SET status = 'selesai', 
              tanggal_realisasi_selesai = CURDATE(),
              output_realisasi = ?,
              updated_at = NOW()
          WHERE id = ?
        `, [outputTervalidasi, k.id]);
        console.log(`   >>> DONE: Status diubah ke 'selesai'`);
      }
    }

    console.log('\n=== SELESAI ===\n');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

debugAutoComplete();
