const { Client } = require('pg');

async function testPassword(passwordStr) {
  const client = new Client({
    host: 'aws-0-ap-northeast-1.pooler.supabase.com',
    port: 6543,
    user: 'postgres.fkmaxikzokarqcnjplzd',
    password: passwordStr,
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });
  try {
    await client.connect();
    console.log('SUCCESS with password:', passwordStr);
    await client.end();
    return true;
  } catch (e) {
    console.log('Failed for', passwordStr, ':', e.message);
    return false;
  }
}

async function run() {
  await testPassword('LKLiza@2107');
  await testPassword('\'LKLiza@2107\'');
  await testPassword('LKLiza2107');
}
run();
