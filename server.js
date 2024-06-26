const cors = require('cors');
require('dotenv').config();
const express = require('express');
const http = require('http');
const fileUpload = require('express-fileupload');
const { connectToDB } = require('./config/database');
const bootstrap = require('./bootstrap');
const { errorProcessing } = require('./middlewares/errorHandling');
const { Notification } = require('./models/Notification');
const { Server } = require('socket.io');

const app = express();
const router = express.Router();

const server = http.createServer(app);

// const frontURL = 'http://localhost:3000';
// const frontURL = 'https://wash-with-kings.vercel.app';
const frontURL = 'https://www.washwithkings.com';

const io = new Server(server, {
  cors: {
    origin: frontURL,
    methods: ['GET', 'POST'],
  },
});

const corsOptions = {
  origin: frontURL,
  credentials: true, //access-control-allow-credentials:true
  optionSuccessStatus: 200,
};

io.on('connection', async (socket) => {
  console.log('Client connected');
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 });
    socket.emit('notifications', notifications);

    // Marks notification as read
    socket.on('markNotificationAsRead', async (notificationId) => {
      try {
        const notification = await Notification.findById(notificationId);
        if (notification) {
          notification.read = true;
          await notification.save();
          console.log(`Notification ${notificationId} marked as read`);
        } else {
          console.log(`Notification ${notificationId} not found`);
        }
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
  }

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

Notification.watch().on('change', async () => {
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 });
    io.emit('notifications', notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
  }
});

app.use(cors(corsOptions));

app.use(express.json());
app.use(fileUpload({ useTempFiles: true }));
app.use(router);

const routes = require(`./routes/routes`);

bootstrap(router, routes);

//Handle invalid endpoint
app.use((_, __, next) => {
  next({
    errorCode: 404,
    errorMessage: {
      statusCode: 404,
      message: 'Invalid Endpoint.',
    },
  });
});

app.use((error, request, response, next) => {
  if (error instanceof Error) error = errorProcessing(error);
  const statusCode = error.errorCode ? error.errorCode : 500;
  const statusMessage = error.errorMessage
    ? error.errorMessage
    : { error: { message: 'Internal server error.' } };
  // if status code is 500, log error to error.log file.
  response.status(parseInt(statusCode)).json(statusMessage);
});

const PORT = process.env.PORT || 5000;

const setUpServer = () => {
  connectToDB('washWithKings', () => {
    server.listen(PORT, () => {
      console.log(`Connected to port ${PORT} sucessfully`);
    });
  });
};

setUpServer();

