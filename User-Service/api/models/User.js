const { DataTypes } = require('sequelize');
const sequelize = require('../../config/sequelize');

const User = sequelize.define("User", {
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
  role: {
    type: DataTypes.ENUM("owner", "employee"),
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  businessTypeId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'business_type_id',
  },
  companyName: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    field: 'company_name'
  },
  companyDescription: {
    type: DataTypes.STRING,
    allowNull: true,
    field:'company_description'
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    field: 'is_verified',
    defaultValue: false,
    allowNull: false,
  },
  forgotPasswordOtp: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'forgot_password_otp'
  },
  forgotPasswordOtpExpiresAt: {
    type: DataTypes.BIGINT,
    allowNull: true,
    field: 'forgot_password_otp_expires_at',
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
  tableName: "users",
  freezeTableName: true,
  timestamps: false,
});

module.exports = User;

