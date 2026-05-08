  const redis = require("redis");

  const client = redis.createClient({
    url: process.env.REDIS_URL,
    socket: {
      reconnectStrategy: (retries) => {
        console.log(`🔁 Redis reconnect attempt #${retries}`);
        return Math.min(retries * 100, 3000); // retry delay
      },
    },
  });

  client.on("connect", () => {
    console.log("🔄 Redis connecting...");
  });


  client.on("error", (err) => {
    console.error("❌ Redis Client Error:", err.message);
  });

  client.connect();

  module.exports = client;
