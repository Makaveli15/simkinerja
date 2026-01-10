<?php

/**
 * Script untuk membuat tabel evaluasi_pimpinan
 * Jalankan script ini di browser: http://localhost/simkinerja/scripts/run-migration.php
 * Pastikan database simkinerja sudah ada
 */

$host = 'localhost';
$user = 'root';
$pass = '';
$db = 'simkinerja';

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    die("Koneksi gagal: " . $conn->connect_error);
}

// Create evaluasi_pimpinan table
$sql = "CREATE TABLE IF NOT EXISTS evaluasi_pimpinan (
    id INT AUTO_INCREMENT PRIMARY KEY,
    kegiatan_id INT NOT NULL,
    user_id INT NOT NULL,
    jenis_evaluasi ENUM('catatan', 'arahan', 'rekomendasi') NOT NULL DEFAULT 'catatan',
    isi TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (kegiatan_id) REFERENCES kegiatan_operasional(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_kegiatan (kegiatan_id),
    INDEX idx_user (user_id),
    INDEX idx_jenis (jenis_evaluasi),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";

if ($conn->query($sql) === TRUE) {
    echo "<p style='color: green;'>✓ Tabel evaluasi_pimpinan berhasil dibuat atau sudah ada.</p>";
} else {
    echo "<p style='color: red;'>✗ Error membuat tabel evaluasi_pimpinan: " . $conn->error . "</p>";
}

// Check if table exists
$result = $conn->query("SHOW TABLES LIKE 'evaluasi_pimpinan'");
if ($result->num_rows > 0) {
    echo "<p style='color: blue;'>ℹ Tabel evaluasi_pimpinan sudah ada di database.</p>";

    // Show table structure
    $columns = $conn->query("DESCRIBE evaluasi_pimpinan");
    echo "<h3>Struktur Tabel:</h3>";
    echo "<table border='1' cellpadding='5'>";
    echo "<tr><th>Field</th><th>Type</th><th>Null</th><th>Key</th><th>Default</th><th>Extra</th></tr>";
    while ($row = $columns->fetch_assoc()) {
        echo "<tr>";
        echo "<td>{$row['Field']}</td>";
        echo "<td>{$row['Type']}</td>";
        echo "<td>{$row['Null']}</td>";
        echo "<td>{$row['Key']}</td>";
        echo "<td>{$row['Default']}</td>";
        echo "<td>{$row['Extra']}</td>";
        echo "</tr>";
    }
    echo "</table>";
}

$conn->close();

echo "<br><hr><p>Migration selesai!</p>";
echo "<p><a href='http://localhost:3000/pimpinan/dashboard'>Kembali ke Dashboard Pimpinan</a></p>";
