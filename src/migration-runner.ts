// src/migrations/migration-runner.ts
import path from 'path';
import fs from 'fs';
import { pool } from './db/db';

class MigrationRunner {
    private static async ensureMigrationsTable() {
        await pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    }

    private static async getExecutedMigrations(): Promise<string[]> {
        const result = await pool.query('SELECT name FROM migrations ORDER BY id');
        return result.rows.map(row => row.name);
    }

    public static async runMigrations() {
        await this.ensureMigrationsTable();
        const executedMigrations = await this.getExecutedMigrations();

        const migrationFiles = fs.readdirSync(path.join(__dirname, 'scripts'))
            .filter(file => file.endsWith('.sql'))
            .sort();

        for (const file of migrationFiles) {
            if (!executedMigrations.includes(file)) {

                const sql = fs.readFileSync(
                    path.join(__dirname, 'scripts', file),
                    'utf-8'
                );

                await pool.query(sql);
                await pool.query(
                    'INSERT INTO migrations (name) VALUES ($1)',
                    [file]
                );

            }
        }
    }
}

export { MigrationRunner };