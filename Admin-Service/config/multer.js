const { MULTER, PATH} = require("./constants");

const uploadDir = PATH.join(__dirname, "../public/assets/uploads/");

const storage = MULTER.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); 
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = MULTER({
  storage: storage,
});


module.exports = { upload };


