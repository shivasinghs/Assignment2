const cron = require("node-cron");
const sendEmail = require("../../../helper/mail/send");
const sequelize = require("../../../../config/sequelize");
const { USER_ROLES } = require("../../../../config/constants");

const sendItemCount = async () => {
  try {
    const query = `
      SELECT u.id AS ownerid, u.name AS ownername, u.email, 
             comp.name AS companyname, comp.logo,
             COUNT(DISTINCT i.id) AS itemcount
      FROM users u
      JOIN company comp ON u.company_id = comp.id AND comp.is_deleted = false
      LEFT JOIN item i ON i.company_id = u.company_id AND i.is_deleted = false 
        AND TO_TIMESTAMP(i.created_at) >= NOW() - INTERVAL '1 day'
      WHERE u.role = :ownerRole
      GROUP BY u.id, comp.id
      HAVING COUNT(DISTINCT i.id) > 0;
    `;

    const owners = await sequelize.query(query, {
      replacements: { ownerRole: USER_ROLES.OWNER },
      type: sequelize.QueryTypes.SELECT,
      raw: true,
    });

    console.log("Query Result:", owners);

    for (const owner of owners) {
      const payload = {
        name: owner.ownername,  
        email: owner.email,
        companyName: owner.companyname, 
        itemCount: parseInt(owner.itemcount, 10), 
        logo: owner.logo,
      };

      console.log("Email Payload:", payload);

      await sendEmail(
        process.env.EMAIL_FROM,
        owner.email,
        "item-count-to-owner",
        "item-count",
        payload
      );

      console.log(`Nightly summary email sent to ${owner.email}`);
    }
  } catch (error) {
    console.error(" Error sending nightly item summary:", error);
  }
};


cron.schedule("0 0 * * *", async () => {
  console.log("🔄 Running nightly item summary email task...");
  await sendItemCount();
});

module.exports = sendItemCount;
