const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');
const multer = require('multer');
const { DATA_DIR } = require('../db/connection');
const { FileModel } = require('../models');

const MAX_FILE_SIZE = 25 * 1024 * 1024;
const uploadDirectory = path.join(DATA_DIR, 'files');
fs.mkdirSync(uploadDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDirectory,
  filename: (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const safeExtension = /^\.[a-z0-9]{1,10}$/.test(extension) ? extension : '';
    callback(null, `${randomUUID()}${safeExtension}`);
  }
});

const parseUpload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE, files: 1 }
}).single('file');

function uploadMiddleware(req, res, next) {
  parseUpload(req, res, (error) => {
    if (!error) return next();
    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'Files must be 25 MB or smaller.' });
    }
    return res.status(400).json({ error: error.message || 'Unable to receive this file.' });
  });
}

// Get Files Repository
async function getFiles(req, res) {
  try {
    const list = await FileModel.find();
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Server error' });
  }
}

// Upload a file and save its metadata.
async function uploadFile(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'Choose a file to upload.' });
  }

  try {
    const requestedPath = typeof req.body.path === 'string' ? req.body.path.trim() : 'General';
    const folderPath = requestedPath.replace(/\\/g, '/').split('/').filter(Boolean).join('/') || 'General';
    const newFile = await FileModel.create({
      name: req.file.originalname,
      path: folderPath,
      size: req.file.size,
      type: req.file.mimetype || path.extname(req.file.originalname).slice(1).toUpperCase() || 'FILE',
      uploadedBy: req.user.name,
      storageName: req.file.filename,
      url: `/api/files/${encodeURIComponent(req.file.filename)}/download`,
      version: 1,
      history: []
    });

    res.status(201).json(newFile);
  } catch (error) {
    try {
      await fs.promises.unlink(req.file.path);
    } catch (cleanupError) {
      if (cleanupError.code !== 'ENOENT') {
        console.error('Failed to clean up uploaded file after metadata save failed:', cleanupError);
      }
    }
    res.status(500).json({ error: error.message || 'Server error' });
  }
}

async function downloadFile(req, res) {
  try {
    const file = await FileModel.findOne({ storageName: req.params.storageName });
    if (!file || !file.storageName) {
      return res.status(404).json({ error: 'File not found. It may have been removed or uploaded before file storage was enabled.' });
    }

    const storageName = path.basename(file.storageName);
    if (storageName !== file.storageName) {
      return res.status(400).json({ error: 'Invalid file reference.' });
    }

    const filePath = path.join(uploadDirectory, storageName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'The stored file is no longer available. Please upload it again.' });
    }

    return res.download(filePath, file.name, (error) => {
      if (error && !res.headersSent) {
        res.status(500).json({ error: 'Unable to send this file.' });
      }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Server error' });
  }
}

module.exports = {
  getFiles,
  uploadFile,
  downloadFile,
  uploadMiddleware
};
