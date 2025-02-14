const { PATH, FS } = require("../../../config/constants"); // Import path and file system modules from constants

/**
  Deletes an image file from the server if it exists.
  imageUrl - The URL of the image to be deleted.
 */

const deleteImage = (imageUrl) => {
  if (imageUrl) {
    const filename = imageUrl.split("/").pop(); // Extract the filename from the URL
    const uploadDir = PATH.join(__dirname, "../../../public/assets/uploads"); // Define the uploads directory path
    const fullPath = PATH.join(uploadDir, filename); // Construct the full file path

    // Attempt to delete the file
    FS.unlink(fullPath, (err) => {
      if (err) {
        console.error("Error deleting old image:", err); // Log an error if deletion fails
      }
    });
  }
};

module.exports = deleteImage; // Export the function for use in other modules
