try {
  const express = require("express");
  const cors = require("cors");
  require('dotenv').config();
  const {corsOptions} = require("./config/security");
  const route = require('./config/route');
  const sequelize = require('./config/sequelize')


  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cors(corsOptions));
  app.use('/assets/uploads', express.static('public/assets/uploads'));
  app.use(route);
 
  sequelize
  .sync({ force: false })
  .then(() => {
    console.log("Database synchronized successfully!")
  })
  .catch((error) => {
    console.error("Error during synchronization:", error.message,error)
  })
  
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