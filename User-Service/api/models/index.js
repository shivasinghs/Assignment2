const User = require("./User")
const BusinessType = require('./BusinessType')
const ItemType = require('./ItemType')
const Category = require('./Category')
const Item = require("./Item")

User.belongsTo(BusinessType, { foreignKey: "businessTypeId" });
BusinessType.hasMany(User, { foreignKey: "businessTypeId" });


Company.hasMany(User, { foreignKey: "companyId", as: "users" });
User.belongsTo(Company, { foreignKey: "companyId", as: "company" });

module.exports = {
  User,
  BusinessType,
  ItemType,
  Category,
  Item,
}
