const { FS, PATH } = require('../../../config/constants');
const handlebars = require('handlebars');

/**
  Processes and compiles a Handlebars template with the provided payload.
  templateName - The name of the template file .
  payload - The data to be injected into the template.
 */

const processTemplate = (templateName, payload) => {
  try {
    // Construct the full file path to the template
    const filePath = PATH.join(__dirname, '../../../assets/templates', `${templateName}.hbs`);

    // Read the template file content
    const templateSource = FS.readFileSync(filePath, 'utf8');

    // Compile the template using Handlebars
    const template = handlebars.compile(templateSource);

    // Return the processed template with the injected payload
    return template(payload);
  } catch (error) {
    console.error('Error reading or processing Handlebars template:', error);
    return null;
  }
};

module.exports = processTemplate;
