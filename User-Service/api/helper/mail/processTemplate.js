const { FS, PATH } = require('../../../config/constants');
const handlebars = require('handlebars');

const processTemplate = (templateName, payload) => {
  try {
    const filePath = PATH.join(__dirname, '../../../assets/templates', `${templateName}.hbs`);
    const templateSource = FS.readFileSync(filePath, 'utf8');
    const template = handlebars.compile(templateSource);
    return template(payload);
  } catch (error) {
    console.error('Error reading HBS file:', error);
    return null;
  }
};

module.exports = processTemplate;