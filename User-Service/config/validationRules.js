const commonRules = {
  password: 'required|string|regex:/^(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,16}$/',
};

const validationRules = {
  User: {
    name: "required|string|min:3|max:30",
    email: "required|email",
    password: commonRules.password,
  },
};

module.exports = {
  validationRules
};