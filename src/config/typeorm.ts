import { registerAs } from '@nestjs/config';
import { config as dotenvConfig } from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';


const config = {
  type: 'postgres',
  url: `${process.env.DATABASE_URL}`,
  autoLoadEntities: true,
  migrationsRun: true,
  ssl: false,
  logging: true,
  prepare: false
};
export default registerAs('typeorm', () => config);
export const connectionSource = new DataSource(config as DataSourceOptions);
