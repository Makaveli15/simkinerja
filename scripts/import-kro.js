const ExcelJS = require('exceljs');
const mysql = require('mysql2/promise');

async function importKRO() {
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
    await workbook.xlsx.readFile('C:\\Users\\Marthin Juan\\Documents\\Tugas\\Tugas Final\\Proposal\\Sistem\\master kro.xlsx');
    
    const worksheet = workbook.worksheets[0];
    
    let insertedCount = 0;
    
    // Iterate through rows (skip header if any - in this case no header)
    worksheet.eachRow((row, rowNumber) => {
      // Row values: [null, kode, nama, deskripsi]
      const kode = row.values[1];
      const nama = row.values[2];
      const deskripsi = row.values[3];
      
      if (kode && nama) {
        // Queue insert
        connection.execute(
          'INSERT INTO kro (kode, nama, deskripsi) VALUES (?, ?, ?)',
          [kode, nama, deskripsi || null]
        ).then(() => {
          insertedCount++;
          console.log(`Inserted: ${kode} - ${nama}`);
        }).catch(err => {
          console.error(`Error inserting ${kode}:`, err.message);
        });
      }
    });
    
    // Wait a bit for all inserts to complete
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Verify count
    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM kro');
    console.log(`\nTotal KRO in database: ${rows[0].count}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

importKRO();
