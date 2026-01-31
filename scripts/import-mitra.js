const ExcelJS = require('exceljs');
const mysql = require('mysql2/promise');

async function importMitra() {
  // Connect to database
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'simkinerja'
  });

  try {
    // Read Excel file
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile('C:\\Users\\Marthin Juan\\Documents\\Tugas\\Tugas Final\\Proposal\\Sistem\\master mitra.xlsx');
    
    const worksheet = workbook.worksheets[0];
    
    let insertedCount = 0;
    let errorCount = 0;
    const insertPromises = [];
    
    // Iterate through rows
    worksheet.eachRow((row, rowNumber) => {
      // Row values: [null, nama, posisi, alamat, jk, no_telp, sobat_id, email]
      const nama = row.values[1];
      const posisi = row.values[2];
      const alamat = row.values[3];
      // Convert "Lk" -> "L", "Pr" -> "P" for ENUM field
      let jk = row.values[4];
      if (jk === 'Lk') jk = 'L';
      else if (jk === 'Pr') jk = 'P';
      const no_telp = row.values[5];
      const sobat_id = row.values[6];
      const email = row.values[7];
      
      if (nama) {
        const promise = connection.execute(
          'INSERT INTO mitra (nama, posisi, alamat, jk, no_telp, sobat_id, email) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [nama, posisi || null, alamat || null, jk || null, no_telp || null, sobat_id || null, email || null]
        ).then(() => {
          insertedCount++;
          if (insertedCount % 50 === 0) {
            console.log(`Progress: ${insertedCount} records inserted...`);
          }
        }).catch(err => {
          errorCount++;
          console.error(`Error inserting ${nama}:`, err.message);
        });
        
        insertPromises.push(promise);
      }
    });
    
    // Wait for all inserts to complete
    await Promise.all(insertPromises);
    
    console.log(`\n=== Import Complete ===`);
    console.log(`Successfully inserted: ${insertedCount} records`);
    console.log(`Errors: ${errorCount}`);
    
    // Verify count
    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM mitra');
    console.log(`Total Mitra in database: ${rows[0].count}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

importMitra();
