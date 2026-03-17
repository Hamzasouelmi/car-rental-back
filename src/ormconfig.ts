import { DataSource, DataSourceOptions } from 'typeorm';
import { databaseConfig } from './shared/config/database.config';
import { User } from './users/user/user.entity';

export const connectionSource = new DataSource({
  ...(databaseConfig as DataSourceOptions),
  entities: [User],
  migrations: ['src/migrations/*.ts'],
});
