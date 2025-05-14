export default {
  log: {
    level: 'LOG_LEVEL',
  },
  graphqlPlayground: 'GRAPHQL_PLAYGROUND',
  redis: {
    host: 'REDIS_HOST',
    port: 'REDIS_PORT',
    username: 'REDIS_USERNAME',
    password: 'REDIS_PASSWORD',
    prefix: 'REDIS_PREFIX',
    tls: 'REDIS_TLS',
  },
  pubsub: {
    timeout: 'PUBSUB_TIMEOUT',
  },
  cache: {
    ttl: 'CACHE_TTL',
  },
  services: {},
};

export const isProduction = process.env.NODE_ENV === 'production';

export const useSSL = Boolean(process.env.LOCALHOST_HTTPS);
