const { DataTypes } = require("sequelize")
const sequelize = require("../../config/sequelize")
const { ADMIN_ROLES } = require("../../config/constants");

const Admin = sequelize.define("Admin", {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4, 
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  gender: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  image: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  role: {
    type: DataTypes.ENUM(...Object.values(ADMIN_ROLES)),
    allowNull: false,
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
    type: DataTypes.INTEGER,
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
    type: DataTypes.DATE,
    field: "deleted_at",
    allowNull: true
  }
}, {
  tableName: "admin",
  timestamps: false,
});

module.exports = Admin
