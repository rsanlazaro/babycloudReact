require("dotenv").config();
const express = require("express");
const cors = require('cors');

const app = express();

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json());

// routes
app.use('/api/upload', require('./routes/upload.routes'));

app.listen(4000, () => console.log('Server running on port 4000'));

const uploadRoutes = require("./routes/upload.routes");

app.use("/api/upload", uploadRoutes);

app.listen(4000, () => console.log("Server running"));
