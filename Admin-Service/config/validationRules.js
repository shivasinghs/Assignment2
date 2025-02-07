const commonRules = {
  password: 'required|string|regex:/^(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,16}$/',
};

const validationRules = {

};

module.exports = {
  validationRules
};