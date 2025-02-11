const { USER_ROLES, ADMIN_ROLES } = require("./constants");

const commonRules = {
  password: 'required|string|regex:/^(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,16}$/',
  phone: "required|string|regex:/^\\+?[0-9]{10,15}$/", 
};

const validationRules = {
  User: {
    id: "required|string",
    name: "required|string|max:64",
    email: "required|email",
    password: commonRules.password,
    gender: "required|string|in:Male,Female,Other",
    role: `required|string|in:${Object.values(USER_ROLES).join(",")}`,
    phone: commonRules.phone,
    businessTypeId: "required|string",
    companyId: "required|string",
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
    id: "required|string",
    name: "required|string|max:64",
    description: "string|max:500",
  },

  Item: {
    id: "required|string",
    name: "required|string|max:64",
    companyId: "required|string",
    itemTypeId: "required|string",
    categoryId: "required|string",
    description: "string|string",
  },
};

module.exports = validationRules;
