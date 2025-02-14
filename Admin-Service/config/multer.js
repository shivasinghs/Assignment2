const { MULTER, PATH, uuidv4 } = require("./constants");

const uploadDir = PATH.join(__dirname, "../public/assets/uploads/");

const storage = MULTER.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueFilename = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueFilename);
  },
});

const upload = MULTER({
  storage: storage,
});

module.exports = { upload };



