const { Admin } = require("../api/models/index");
const { BCRYPT, uuidv4, ADMIN_ROLES } = require("./constants");


const bootstrap = async () => {
  try {
    const existingAdmin = await Admin.findOne({
      where: { isDeleted: false },
      attributes: ["id"],
    });

    if (existingAdmin) {
      return; 
    }

    const data = {
      name: "shiva",
      email: "shiva1234@gmail.com",
      password: "Shiva@1234",
      gender : "Male",
      role: ADMIN_ROLES.SUPER_ADMIN,
    };

    const hashedPassword = await BCRYPT.hash(data.password, 10);

    await Admin.create({
      id: uuidv4(),
      name: data.name,
      email: data.email,
      password: hashedPassword,
      gender: data.gender,
      role: data.role,
      isActive: true,
      createdAt: Math.floor(Date.now() / 1000),
    });

  } catch (error) {
    console.error("Error in bootstrap:", error.message);
    throw error;
  }
};

module.exports = bootstrap;
