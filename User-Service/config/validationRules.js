const { USER_ROLES } = require("./constants");

const commonRules = {
  password: 'required|string|regex:/^(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,16}$/',
  phone: "required|string|regex:/^\\+?[0-9]{10,15}$/", 
};

const validationRules = {
  User: {
    name: "required|string|max:64",
    email: "required|email|unique",
    password: commonRules.password,
    gender: "required|string|in:Male,Female,Other",
    role: `required|string|in:${Object.values(USER_ROLES).join(",")}`,
    phone: commonRules.phone,
    businessTypeId: "required|string",
    companyId: "required|string",
    companyName: "required|string|max:64",
    companyDescription: "string|max:500",
  },

  BusinessType: {
    name: "required|string|max:64|unique",
  },

  Category: {
    name: "required|string|max:64|unique",
    itemTypeId: "required|string",
    description: "string|max:255",
    logo: "string|url",
  },

  Company: {
    name: "required|string|max:64|unique",
    description: "string|max:500",
    userId: "required|string",
  },

  Item: {
    name: "required|string|max:64|unique",
    companyId: "required|string",
    itemTypeId: "required|string",
    categoryId: "required|string",
    description: "string|string",
    image: "string",
  },

  ItemType: {
    name: "required|string|max:64|unique",
    description: "string|max:255",
  },
};

module.exports = validationRules;
