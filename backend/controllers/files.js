const { FileModel } = require('../models');

// Get Files Repository
async function getFiles(req, res) {
  try {
    const list = await FileModel.find();
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Server error' });
  }
}

// Upload File Entry
async function uploadFile(req, res) {
  try {
    const { name, path: folderPath, size, type } = req.body;
    const { name: uploaderName } = req.user;

    if (!name || !size || !type) {
      return res.status(400).json({ error: 'File name, size and type are required' });
    }

    const newFile = await FileModel.create({
      name,
      path: folderPath || 'General',
      size: Number(size),
      type,
      uploadedBy: uploaderName,
      url: `https://zinterns.s3.amazonaws.com/files/${name}`,
      version: 1,
      history: []
    });

    res.status(201).json(newFile);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Server error' });
  }
}

module.exports = {
  getFiles,
  uploadFile
};
