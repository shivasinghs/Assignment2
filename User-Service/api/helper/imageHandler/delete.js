const { PATH, FS } = require("../../../config/constants");

const deleteImage = (imageUrl) => {
  if (imageUrl) {
    const filename = imageUrl.split("/").pop(); 
    const uploadDir = PATH.join(__dirname, "../../../public/assets/uploads"); 
    const fullPath = PATH.join(uploadDir, filename);

    FS.unlink(fullPath, (err) => {
      if (err) {
        console.error("Error deleting old image:", err);
      }
    });
  }
};

module.exports = deleteImage;
