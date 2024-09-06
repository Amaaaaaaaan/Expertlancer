const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    username: String,
    text: String,
    timestamp: {
        type: Date,
        default: Date.now
    },
    fileName: String,    // Add this field to store file name
    fileData: Buffer,     // Add this field to store the file data as binary
    fileType: String      // Optional: Add this to store the MIME type of the file
});

module.exports = mongoose.model('Message', messageSchema);
