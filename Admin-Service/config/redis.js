const redis = require('redis');

const client = redis.createClient({
    socket: {
        host: process.env.REDIS_HOST,
        port: 11688
    },
    username: 'default',
    password: process.env.REDIS_PASS
});

client.on('error', err => console.error('Redis Client Error', err));

async function connectRedis() {
    if (!client.isOpen) {
        await client.connect();
        console.log('Connected to Redis');
    }
}

connectRedis();

module.exports = client;


