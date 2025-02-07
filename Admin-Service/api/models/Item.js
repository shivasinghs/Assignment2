const { DataTypes } = require("sequelize")
const sequelize = require("../../config/sequelize")
const Company = require("./Company")
const ItemType = require("./ItemType")
const Category = require("./Category")

const Item = sequelize.define(
  "Item",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    companyId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "company_id",
      references: {
        model: Company,
        key: "id"
      }
    },
    itemTypeId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "item_type_id",
      references: {
        model: ItemType,
        key: "id"
      }
    },
    categoryId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "category_id",
      references: {
        model: Category,
        key: "id"
      }
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true
    },
    image: {
      type: DataTypes.STRING,
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      field: "is_active",
      defaultValue: true
    },
    createdAt: {
      type: DataTypes.BIGINT,
      field: "created_at",
      allowNull: false,
      defaultValue: Math.floor(Date.now() / 1000)
    },
    createdBy: {
      type: DataTypes.UUID,
      field: "created_by",
      allowNull: true
    },
    updatedAt: {
      type: DataTypes.BIGINT,
      field: "updated_at",
      allowNull: true
    },
    updatedBy: {
      type: DataTypes.UUID,
      field: "updated_by",
      allowNull: true
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      field: "is_deleted",
      defaultValue: false
    },
    deletedBy: {
      type: DataTypes.UUID,
      field: "deleted_by",
      allowNull: true
    },
    deletedAt: {
      type: DataTypes.BIGINT,
      field: 'deleted_at',
      allowNull: true,
    },
  },
  {
    tableName: "item",
    freezeTableName: true,
    timestamps: false
  }
)

module.exports = Item
