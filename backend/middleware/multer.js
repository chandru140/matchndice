import multer from "multer";
import path from "path";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_SIZE_MB = 5;

const storage = multer.diskStorage({
    filename: function (req, file, callback) {
        // Sanitize filename to prevent path traversal
        const sanitizedName = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, "_");
        const uniqueSuffix = Date.now() + "_" + Math.round(Math.random() * 1e9);
        callback(null, uniqueSuffix + "_" + sanitizedName);
    },
});

const fileFilter = (req, file, callback) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        callback(null, true);
    } else {
        callback(
            new Error(`Invalid file type: ${file.mimetype}. Only JPEG, PNG, WebP, and GIF images are allowed.`),
            false
        );
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: MAX_FILE_SIZE_MB * 1024 * 1024, // 5 MB per file
        files: 4, // Maximum 4 files per request
    },
});

export default upload;