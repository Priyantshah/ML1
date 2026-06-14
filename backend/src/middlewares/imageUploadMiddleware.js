import multer from "multer";

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    const allowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];

    const extension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf("."));

    if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(extension)) {
        cb(null, true);
    } else {
        const error = new Error("Only images (JPG, PNG, GIF, WEBP) are allowed");
        error.status = 400;
        cb(error, false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // Increased to 10MB just in case
    }
});

export default upload;
