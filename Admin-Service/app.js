try {
  const express = require("express");
  const cors = require("cors");
  const {corsOptions} = require("./config/security");
  require('dotenv').config();
  const route = require('./config/route');
  const bootstrap = require('./config/bootstrap')

// Initialize Express app
  const app = express();

// Middleware for parsing JSON and URL-encoded data
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Enable CORS with predefined options
  app.use(cors(corsOptions));

   // Serve static files for uploaded assets
  app.use('/assets/uploads', express.static('public/assets/uploads'));

  //  API routes
  app.use(route);
 
  //super admin created by bootstrap function
  bootstrap()
  .then((data) => {
    console.log(data);
  })
  .catch(err => {
    console.error( err);
  });

  app.get("/", (req, res) => {
    res.send("Hello from the backend!");
  });

  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
} catch (error) {
  throw error;
}