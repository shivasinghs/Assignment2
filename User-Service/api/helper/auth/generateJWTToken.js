const { JWT } = require("../../../config/constants"); 

const secretKey = process.env.JWT_SECRET; // Retrieve the secret key from environment variables

/**
   Generates a JWT token with the given payload and expiration time.
   payload - Data to be encoded in the token.
   expiresIn - Expiration time (e.g., "1h", "7d", 3600).
 **/

function generateJWTToken(payload, expiresIn) {
  try {
    const token = JWT.sign(payload, secretKey, { expiresIn }); // Generate the JWT token
    return token; // Return the generated token
  } catch (error) {
    console.error("Error generating token:", error); // Log any errors encountered
    throw new Error("Error generating token"); // Throw a generic error to avoid exposing sensitive details
  }
}

module.exports = {
  generateJWTToken, // Export the function for use in other parts of the application
};

