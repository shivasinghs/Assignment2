const Admin = require('./Admin')
const User = require("./User")
const BusinessType = require('./BusinessType')
const ItemType = require('./ItemType')
const Category = require('./Category')
const Item = require("./Item")
const Company = require('./Company')

ItemType.hasMany(Category, { foreignKey: "itemTypeId" });
Category.belongsTo(ItemType, { foreignKey: "itemTypeId" });

ItemType.hasMany(Item, { foreignKey: "itemTypeId" });
Item.belongsTo(ItemType, { foreignKey: "itemTypeId" });

Category.hasMany(Item, { foreignKey: "categoryId" });
Item.belongsTo(Category, { foreignKey: "categoryId" });

module.exports = {
  Admin,
  User,
  BusinessType,
  ItemType,
  Category,
  Item,
  Company,
}
