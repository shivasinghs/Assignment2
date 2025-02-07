const { JWT } = require("../../../config/constants")

const secretKey = process.env.JWT_SECRET 

function generateToken(payload, expiresIn) {
  try {
    const token = JWT.sign(payload, secretKey, { expiresIn })
    return token
  } catch (error) {
    console.error("Error generating token:", error)
    throw new Error("Error generating token")
  }
}

module.exports = {
  generateToken
}
