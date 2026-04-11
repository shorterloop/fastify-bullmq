import { envsafe, port, str } from 'envsafe';

export const env = envsafe({
  REDISHOST: str(),
  REDISPORT: port(),
  REDISUSER: str(),
  REDISPASSWORD: str(),
  PORT: port({
    devDefault: 3000,
  }),
});
