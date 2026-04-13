import { Redis } from '@upstash/redis'
import path from 'path';
import dotenv from 'dotenv';

// Carrega o .env caso este arquivo seja importado antes do index.ts (commom em Monorepos)
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})
