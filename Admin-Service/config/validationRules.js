const { USER_ROLES, ADMIN_ROLES } = require("./constants");

const commonRules = {
  password: 'required|string|regex:/^(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,16}$/',
  phone: "required|string|regex:/^\\+?[0-9]{10,15}$/", 
};

const validationRules = {
  User: {
    name: "required|string|max:64",
    email: "required|email",
    password: commonRules.password,
    gender: "required|string|in:Male,Female,Other",
    role: `required|string|in:${Object.values(USER_ROLES).join(",")}`,
    phone: commonRules.phone,
    businessTypeId: "required|string",
    companyId: "required|string",
    companyName: "required|string|max:64",
    companyDescription: "string|max:500",
  },

  Admin: {
    id: "required|string",
    name: "required|string|max:64",
    email: "required|email",
    password: commonRules.password,
    gender: "required|string|in:Male,Female,Other",
    role: `required|string|in:${Object.values(ADMIN_ROLES).join(",")}`,
  },

  BusinessType: {
    id: "required|string",
    name: "required|string|max:64",
  },

  ItemType: {
    id: "required|string",
    name: "required|string|max:64",
    description: "string|max:255",
  },

  Category: {
    id: "required|string",
    itemTypeId : "required|string",
    name: "required|string|max:64",
    itemTypeId: "required|string",
    description: "string|max:255",
  },

  Company: {
    name: "required|string|max:64",
    description: "string|max:500",
  },

  Item: {
    name: "required|string|max:64",
    companyId: "required|string",
    itemTypeId: "required|string",
    categoryId: "required|string",
    description: "string|string",
  },
};

module.exports = validationRules;
