const corsOptions = {
    origin: '*',
    methods: ['GET', 'POST', 'PUT','DELETE'],  // Allowed methods
    allowedHeaders: ['Content-Type', 'Authorization'],  // Allowed headers
  };

module.exports = {corsOptions};