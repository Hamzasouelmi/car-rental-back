/*import * as path from 'path';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { __DEV__ } from '../constants/envs';
import { User } from 'src/users/user/user.entity';

const env = process.env.NODE_ENV || __DEV__;
const dotenv_path = path.resolve(process.cwd(), `.${env}.env`);
dotenv.config({ path: dotenv_path });

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.POSTGRESQL_ADDON_URI,
  synchronize: false,
  entities: [User],
  migrations: ['src/migrations/*.ts'],
});

export default AppDataSource;*/
