const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const { Server } = require('socket.io');
const mongoose = require('mongoose');  // Import mongoose
const Message = require('./models/Message');  // Import the Message model

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
      // Fetch the last 100 messages from the database and send them to the new user
      const messages = await Message.find().sort({ timestamp: 1 }).limit(100).exec();
      socket.emit('chatHistory', messages);
  } catch (err) {
      console.error('Error fetching chat history:', err);
  }

  // Handle new messages
  socket.on('newmessage', async (data) => {
      try {
          // Save the message to the database
          const message = new Message({
              username: data.username,
              text: data.text,
          });

          await message.save(); // Use await to save the message

          // Broadcast the message to everyone (including the sender)
          io.emit('message', data);
      } catch (err) {
          console.error('Error saving message:', err);
      }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
     
  });
});


const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
