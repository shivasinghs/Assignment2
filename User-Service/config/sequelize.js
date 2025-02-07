const { Sequelize } = require('sequelize');

require('dotenv').config();

const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  logging: false, 
});

sequelize
  .authenticate()
  .then(() => {
    console.log('Connection has been established successfully.');
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });

  sequelize
  .sync({ force: false })
  .then(() => {
    console.log("Database synchronized successfully!")
  })
  .catch((error) => {
    console.error("Error during synchronization:", error.message,error)
  })

module.exports = sequelize;
