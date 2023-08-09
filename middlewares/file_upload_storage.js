const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid'); // Import UUID library

// Configure storage for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads');
  },
  filename: (req, file, cb) => {
    const uniqueFilename = uuidv4() + path.extname(file.originalname); // Use UUID for unique filenames
    cb(null, uniqueFilename);
  },
});

const upload = multer({ storage });
module.exports = upload;