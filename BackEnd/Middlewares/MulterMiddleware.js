import multer from "multer";

// Store files in memory for quick analysis
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.(pdf)$/i)) {
      return cb(new Error("Only PDF files are allowed!"));
    }
    cb(null, true);
  },
});

// Multer error handler middleware
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError || err.message) {
    return res.status(400).json({ success: false, error: err.message });
  }
  next();
};

export { upload, handleMulterError };
