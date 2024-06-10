const pool = require('./src/db'); // Ajusta la ruta según la ubicación de tu archivo db.js

async function testQuery() {
  try {
    const [results] = await pool.query('SELECT * FROM products ORDER BY createdAt DESC LIMIT 5');
    console.log("Resultados de la consulta desde script de prueba:", results);
  } catch (error) {
    console.error("Error ejecutando la consulta de prueba:", error);
  }
}

testQuery();
