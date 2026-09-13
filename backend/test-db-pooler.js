const { Client } = require('pg');
const client = new Client({
  host: 'aws-0-ap-northeast-1.pooler.supabase.com',
  port: 6543,
  user: 'postgres.fkmaxikzokarqcnjplzd',
  password: 'pass-Liza@2107',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});
client.connect()
  .then(() => { console.log('Connected to pooler!'); client.end(); })
  .catch(err => console.error('Connection error', err.message));
