const cron = require("node-cron");
const sendEmail = require("../../helper/mail/send");
const sequelize = require("../../../config/sequelize");
const { USER_ROLES,MAIL_TYPES,MAIL_TEMPLATES } = require("../../../config/constants");

const sendItemCount = async () => {
  try {
    // Define the SELECT clause to fetch owner details along with the item count
    let selectClause = `
        SELECT 
            u.id AS ownerid, 
            u.name AS ownername, 
            u.email, 
            comp.name AS companyname, 
            comp.logo, 
            COUNT(DISTINCT i.id) AS itemcount
    `;
    
    // Define the FROM clause with necessary table joins
    let fromClause = `\n
        FROM users u
        LEFT JOIN company comp 
            ON u.company_id = comp.id 
            AND comp.is_deleted = false
        LEFT JOIN item i 
            ON i.company_id = u.company_id 
            AND i.is_deleted = false 
            AND TO_TIMESTAMP(i.created_at) >= NOW() - INTERVAL '1 day'
    `;
    
    // Define the WHERE clause to filter only owners
    let whereClause = `\n
        WHERE u.role = :ownerRole
    `;
    
    // Define the GROUP BY clause to aggregate data per owner and company
    let groupByClause = `\n
        GROUP BY u.id, comp.id
    `;
    
    // Construct the final SQL query by concatenating all clauses
    const query = ""
        .concat(selectClause)
        .concat(fromClause)
        .concat(whereClause)
        .concat(groupByClause);

    // Execute the query to fetch owners with newly added items in the last 24 hours
    const owners = await sequelize.query(query, {
      replacements: { ownerRole: USER_ROLES.OWNER },
      type: sequelize.QueryTypes.SELECT,
      raw: true,
    });

    console.log("Query Result:", owners);

    // Loop through the owners and send summary emails
    for (const owner of owners) {
      // Prepare email payload with necessary owner and company details
      const payload = {
        name: owner.ownername,  
        email: owner.email,
        companyName: owner.companyname, 
        itemCount: parseInt(owner.itemcount, 10), 
        logo: owner.logo,
      };

      console.log("Email Payload:", payload);

      // Send summary email to the owner
      await sendEmail(
        process.env.EMAIL_FROM, 
        owner.email, 
        MAIL_TYPES.ITEM_COUNT_TO_OWNER, 
        MAIL_TEMPLATES.ITEM_COUNT, 
        payload 
      );

      console.log(`Nightly summary email sent to ${owner.email}`);
    }
  } catch (error) {
    // Handle any errors that occur during execution
    console.error("Error sending nightly item summary:", error);
  }
};

// Schedule the cron job to run daily at midnight
cron.schedule("0 0 * * *", async () => {
  console.log("🔄 Running nightly item summary email task...");
  await sendItemCount();
});

// Export the function for external use
module.exports = sendItemCount;
