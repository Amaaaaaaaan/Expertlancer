const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const { Server } = require('socket.io');
const mongoose = require('mongoose');  // Import mongoose
const Message = require('./models/message');  // Import the Message model

const app = express();
const userRoutes = require('./routes/userRoutes');
const projectRoutes = require('./routes/projectRoutes');
const jobRoutes = require('./routes/jobRoutes');
const freelancerRoutes = require('./routes/freelancerRoutes');

const http = require('http');
const server = http.createServer(app);
const io = new Server(server);

const db = require('./config/mongooseconnection');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());

app.use('/', userRoutes);
app.use('/project', projectRoutes);
app.use('/job', jobRoutes);
app.use('/', freelancerRoutes);

io.on('connection', async (socket) => {
    try {
        // Fetch and send chat history
        const messages = await Message.find().sort({ timestamp: 1 }).limit(100).exec();
        socket.emit('chatHistory', messages);
    } catch (err) {
        console.error('Error fetching chat history:', err);
    }

    // Handle new text messages
    socket.on('newmessage', async (data) => {
        try {
            const message = new Message({
                username: data.username,
                text: data.text,
            });
            await message.save();
            io.emit('message', data);
        } catch (err) {
            console.error('Error saving message:', err);
        }
    });

    // Handle file messages
    socket.on('sendfile', async (data) => {
        try {
            const message = new Message({
                username: data.username,
                fileName: data.fileName,
                fileData: Buffer.from(data.fileData, 'base64'),  // Store the file data as base64 in the database
                fileType: data.fileType   // Optionally store the file type (e.g., image/png, application/pdf)
            });
            await message.save();

            // Send file metadata to all connected clients (without base64 data)
            io.emit('message', {
                username: data.username,
                fileName: data.fileName,
                fileType: data.fileType,  // Send file metadata
                fileData: data.fileData   // Base64 data for client-side rendering
            });
        } catch (err) {
            console.error('Error saving file:', err);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

  


const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
