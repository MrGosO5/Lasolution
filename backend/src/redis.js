let client;
let Redis;

function getRedis() {
  const url = process.env.REDIS_URL;
  if (!url) return null;
  try {
    Redis = Redis || require("ioredis");
    if (!client) {
      client = new Redis(url, { maxRetriesPerRequest: 2, lazyConnect: true });
      client.on("error", (e) => console.warn("[redis]", e.message));
    }
    return client;
  } catch {
    return null;
  }
}

module.exports = { getRedis };
