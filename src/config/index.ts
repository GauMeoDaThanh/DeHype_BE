import { config as dotenvConfig } from 'dotenv';
dotenvConfig({ path: '.env' });

export const config = {
    redisUrl: process.env.REDIS_URL,
}