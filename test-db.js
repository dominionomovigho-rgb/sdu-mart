const pool = require('./db');

async function testConnection() {
    try {
        const [rows] = await pool.query('SHOW TABLES');
        console.log('Connected successfully! Tables in sdu_mart:');
        console.log(rows);
    } catch (err) {
        console.error('Connection failed:', err.message);
    }
    process.exit();
}

testConnection();