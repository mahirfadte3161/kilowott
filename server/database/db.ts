import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SCHEMA_SQL } from './schema.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure the data directory exists
const dbDir = path.resolve(__dirname, '../../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = process.env.DATABASE_PATH 
  ? path.resolve(process.cwd(), process.env.DATABASE_PATH)
  : path.join(dbDir, 'crm.db');

export const db = new DatabaseSync(dbPath);

// Initialize database PRAGMAs
db.exec('PRAGMA foreign_keys = ON;');

// PRM Migrations: ensure all PRM columns exist on existing databases BEFORE indexes are created
try {
  const productColumns = (db.prepare("PRAGMA table_info(products)").all() as { name: string }[]).map(c => c.name);
  const addColIfNotExists = (col: string, def: string) => {
    if (!productColumns.includes(col)) {
      try {
        db.exec(`ALTER TABLE products ADD COLUMN ${col} ${def};`);
      } catch {
        // ignore if already added
      }
    }
  };

  addColIfNotExists('product_type', "TEXT NOT NULL DEFAULT 'simple'");
  addColIfNotExists('featured', "INTEGER NOT NULL DEFAULT 0");
  addColIfNotExists('manage_stock', "INTEGER NOT NULL DEFAULT 0");
  addColIfNotExists('short_description', "TEXT");
  addColIfNotExists('weight', "TEXT");
  addColIfNotExists('dimensions_json', "TEXT");
  addColIfNotExists('shipping_class', "TEXT");
  addColIfNotExists('attributes_json', "TEXT");
  addColIfNotExists('variations_json', "TEXT");
  addColIfNotExists('permalink', "TEXT");
  addColIfNotExists('tags_json', "TEXT");
  addColIfNotExists('images_json', "TEXT");
} catch {
  // If products table doesn't exist yet, SCHEMA_SQL will create it with all columns
}

db.exec(SCHEMA_SQL);

// Default PRM Settings
db.prepare("INSERT OR IGNORE INTO prm_settings (key, value, updated_at) VALUES ('low_stock_threshold', '5', datetime('now'))").run();

// Helper methods with typed parameters
export const query = <T = any>(sql: string, params: (string | number | null | undefined | boolean)[] = []): T[] => {
  const stmt = db.prepare(sql);
  const sanitizedParams = params.map(p => (typeof p === 'boolean' ? (p ? 1 : 0) : p === undefined ? null : p));
  return stmt.all(...sanitizedParams) as T[];
};

export const get = <T = any>(sql: string, params: (string | number | null | undefined | boolean)[] = []): T | undefined => {
  const stmt = db.prepare(sql);
  const sanitizedParams = params.map(p => (typeof p === 'boolean' ? (p ? 1 : 0) : p === undefined ? null : p));
  return stmt.get(...sanitizedParams) as T | undefined;
};

export const run = (sql: string, params: (string | number | null | undefined | boolean)[] = []) => {
  const stmt = db.prepare(sql);
  const sanitizedParams = params.map(p => (typeof p === 'boolean' ? (p ? 1 : 0) : p === undefined ? null : p));
  return stmt.run(...sanitizedParams);
};

export const exec = (sql: string) => {
  return db.exec(sql);
};

export default db;
