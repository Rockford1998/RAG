import multer from "multer";
import path from "path";
import fs from "fs";

const storage = multer.diskStorage({
  destination: function (_, __, cb) {
    cb(null, "storage/");
  },
  filename: function (_, file, cb) {
    const filePath = path.join("storage", file.originalname);
    if (fs.existsSync(filePath)) {
      return cb(new Error("File already exist"), "");
    }
    cb(null, file.originalname);
  },
});

export const upload = multer({ storage });
