import pg from 'pg';
const { Pool } = pg;

// Use environment variables for production
const pool = new Pool({
  user: process.env.DATABASE_USER,
  host: process.env.DATABASE_HOST,
  database: process.env.DATABASE_NAME,
  password: process.env.DATABASE_PASSWORD,
  port: isNaN(Number(process.env.DATABASE_PORT))
    ? 5432
    : Number(process.env.DATABASE_PORT),
});
/**
 * Executes a query and returns all rows
 */
export async function query<T>(text: string, params?: any[]): Promise<T[]> {
  // const start = Date.now();
  const res = await pool.query(text, params);
  // const duration = Date.now() - start;

  // Optional: log queries in development
  // console.log('executed query', { text, duration, rows: res.rowCount });

  return res.rows;
}

/**
 * Executes a query and returns the first row or null
 */
export async function queryOne<T>(
  text: string,
  params?: any[]
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] || null;
}

export default pool;
