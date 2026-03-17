import * as path from 'path';
import * as dotenv from 'dotenv';
import { __DEV__, __TEST__ } from '../constants/envs';

const isTestEnv = process.env.NODE_ENV === __TEST__;

const env = process.env.NODE_ENV || __DEV__;

const dotenv_path = path.resolve(process.cwd(), `.${env}.env`);
const result = dotenv.config({ path: dotenv_path });

if (result.error) {
  console.error(`Error loading .env from the environment ${env}`);
}

export const databaseConfig = {
  type: 'postgres',
  url: process.env.POSTGRESQL_ADDON_URI,
  synchronize: false,
  entities: isTestEnv
    ? ['src/**/*.entity.{ts,js}']
    : ['dist/**/*.entity.{ts,js}'],
  migrations: isTestEnv
    ? ['src/migrations/*.{ts,js}']
    : ['dist/src/migrations/*.{ts,js}'],
  cli: {
    migrationsDir: isTestEnv ? 'src/migration' : 'dist/migration',
  },
};
