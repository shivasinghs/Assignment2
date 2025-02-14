try {
  const express = require("express");
  const cors = require("cors");
  require('dotenv').config();
  const {corsOptions} = require("./config/security");
  const route = require('./config/route');
  const sequelize = require('./config/sequelize')
  const sendItemCount = require('./api/controller/itemcountmail/ItemCountMailController')

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
 
  // Synchronize Sequelize with the database 
  sequelize
  .sync({ force: false })
  .then(() => {
    console.log("Database synchronized successfully!")
  })
  .catch((error) => {
    console.error("Error during synchronization:", error.message,error)
  })
  
  //item count email to owner
  //sendItemCount()


  app.get("/", (req, res) => {
    res.send("Hello from the backend!");
  });

  const PORT = process.env.PORT || 8000;

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
} catch (error) {
  throw error;
}