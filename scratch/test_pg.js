const { Client } = require('pg');

async function testConnection(password) {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: password,
    database: 'postgres'
  });

  try {
    await client.connect();
    const res = await client.query('SELECT current_database(), current_user, version()');
    console.log(`SUCCESS with password: "${password}"`);
    console.log(res.rows[0]);
    await client.end();
    return true;
  } catch (err) {
    console.log(`Failed with password "${password}":`, err.message);
    try { await client.end(); } catch(e) {}
    return false;
  }
}

async function run() {
  const common = ['postgres', 'admin', 'root', '123456', '', 'password'];
  for (const pw of common) {
    const ok = await testConnection(pw);
    if (ok) {
      process.exit(0);
    }
  }
  process.exit(1);
}

run();
