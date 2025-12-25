require("dotenv").config();
const express = require("express");
const cors = require('cors');
const session = require('express-session');

const userRoutes = require('./routes/user.routes');
const uploadRoutes = require("./routes/upload.routes");
const authRoutes = require('./routes/auth.routes');

const app = express();

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json());

app.use(
  session({
    name: 'sid',
    secret: 'dev_secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

app.use((req, res, next) => {
  if (!req.session.user) {
    req.session.user = {
      id: 1,
      username: 'johndoe',
      photo: null,
    };

    console.log('DEV AUTO-LOGIN SESSION SET');
  }
  next();
});

// routes
app.use('/api/users', userRoutes);
app.use("/api/upload", uploadRoutes);
app.use('/api/auth', authRoutes);
app.listen(4000, () => console.log("Server running"));
