const { Admin } = require("../api/models/index");
const { BCRYPT, uuidv4, ADMIN_ROLES } = require("./constants");


const bootstrap = async () => {
  try {
    //checking for existing  admin in database 
    const existingAdmin = await Admin.findOne({
      where: { isDeleted: false },
      attributes: ["id"],
    });

    //if admin is not there in database admin is created
    if (!existingAdmin) {
      const data = {
        name: "shiva",
        email: "shiva1234@gmail.com",
        password: "Shiva@1234",
        gender : "Male",
        role: ADMIN_ROLES.SUPER_ADMIN,
      };
  
      //Encrypting the password 
      const hashedPassword = await BCRYPT.hash(data.password, 10);
  
      //creating admin in database 
      
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
    }
    
    return true;

  } catch (error) {
    console.error("Error in bootstrap:", error.message);
    throw error;
  }
};

module.exports = bootstrap;
