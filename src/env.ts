import { envsafe, port, str } from 'envsafe';

export const env = envsafe({
  REDIS_URL: str({ default: '' }),
  REDISHOST: str({ default: '' }),
  REDISPORT: port({ default: 6379 }),
  REDISUSER: str({ default: '' }),
  REDISPASSWORD: str({ default: '' }),
  DASHBOARD_USER: str(),
  DASHBOARD_PASSWORD: str(),
  QUEUENAMES: str({ default: 'insights-ingestion' }),
  PORT: port({
    devDefault: 3000,
  }),
});
