try {
  const express = require("express");
  const cors = require("cors");
  const {corsOptions} = require("./config/security");
  require('dotenv').config();
  const route = require('./config/route');
  const bootstrap = require('./config/bootstrap')


  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cors(corsOptions));
  app.use('/assets/uploads', express.static('public/assets/uploads'));
  app.use(route);
 
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