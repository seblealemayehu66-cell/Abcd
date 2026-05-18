import multer from "multer";
import path from "path";
import fs from "fs";

// CREATE FOLDER IF NOT EXISTS
const createFolder = (folder) => {
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }
};

createFolder("uploads");
createFolder("uploads/temp");
createFolder("uploads/excel");

// STORAGE
const storage = multer.diskStorage({

  destination: function (req, file, cb) {

    // EXCEL FILE
    if (
      file.mimetype.includes("sheet") ||
      file.originalname.endsWith(".xlsx")
    ) {

      cb(null, "uploads/excel/");

    } else {

      cb(null, "uploads/temp/");

    }

  },

  filename: function (req, file, cb) {

    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname);

    cb(null, uniqueName);

  }

});

// FILE FILTER
const fileFilter = (req, file, cb) => {

  const allowedImages = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/jpg"
  ];

  const allowedExcel = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel"
  ];

  if (
    allowedImages.includes(file.mimetype) ||
    allowedExcel.includes(file.mimetype)
  ) {

    cb(null, true);

  } else {

    cb(new Error("Unsupported file type"), false);

  }

};

// MULTER
const upload = multer({

  storage,

  fileFilter,

  limits: {

    fileSize: 20 * 1024 * 1024 // 20MB

  }

});

export default upload;
