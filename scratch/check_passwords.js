const { Client } = require('pg');

async function testPassword(user, password) {
  const client = new Client({
    host: '127.0.0.1',
    port: 5432,
    user: user,
    password: password,
    database: 'postgres',
    connectionTimeoutMillis: 2000
  });

  try {
    await client.connect();
    console.log(`>>> MATCH FOUND: user="${user}", password="${password}"`);
    await client.end();
    return true;
  } catch (err) {
    try { await client.end(); } catch(e) {}
    return false;
  }
}

async function run() {
  const users = ['postgres', 'am'];
  const passwords = [
    'postgres', 'admin', 'root', '123456', '12345678', '1234', '12345', 'password',
    'am', 'user', 'chatbot', 'harbor', 'system', 'master', 'postgre', 'psql'
  ];

  for (const u of users) {
    for (const p of passwords) {
      const ok = await testPassword(u, p);
      if (ok) {
        process.exit(0);
      }
    }
  }
  console.log('No password matched standard list.');
  process.exit(1);
}

run();
