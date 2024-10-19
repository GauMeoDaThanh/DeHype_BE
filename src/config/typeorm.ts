import { registerAs } from '@nestjs/config';
import { config as dotenvConfig } from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';

dotenvConfig({ path: '.env' });
const config = {
  type: 'postgres',
  url: `${process.env.DATABASE_URL}`,
  entities: [__dirname + '/**/entity/*.entity{.ts,.js}'],
  migrations: [__dirname + '/**/migrations/*{.ts,.js}'],
  ssl: false,
  logging: true,
  prepare: false,
};
export default registerAs('typeorm', () => config);
export const connectionSource = new DataSource(config as DataSourceOptions);
