import { createClient } from 'redis';

const redisClient = createClient();

redisClient.connect()
  .then(() => {
    return redisClient.flushAll();
  })
  .then(() => {
    console.log('Redis cache cleared!');
    return redisClient.quit();
  })
  .catch((err) => {
    console.error('Error clearing Redis cache:', err);
  });
