const { Client } = require('pg');
const client = new Client({
  host: 'db.fkmaxikzokarqcnjplzd.supabase.co',
  port: 5432,
  user: 'postgres',
  password: 'pass-Liza@2107',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});
client.connect()
  .then(() => { console.log('Connected!'); client.end(); })
  .catch(err => console.error('Connection error', err.message));
