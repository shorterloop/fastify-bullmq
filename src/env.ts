import { envsafe, port, str } from 'envsafe';

export const env = envsafe({
  REDIS_URL: str({ default: '' }),
  REDISHOST: str({ default: '' }),
  REDISPORT: port({ default: 6379 }),
  REDISUSER: str({ default: '' }),
  REDISPASSWORD: str({ default: '' }),
  PORT: port({
    devDefault: 3000,
  }),
});
