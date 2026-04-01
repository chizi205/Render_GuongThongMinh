const express = require('express');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./middleware/logger');
const path = require("path");
const cors = require("cors");
const app = express();


app.use(cors({
  origin: "*", // Tạm thời cho phép tất cả các domain (vì ngrok đổi link liên tục)
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger);
app.use('/uploads', express.static('uploads'));
app.use("/public", express.static(path.join(__dirname, "public")));
app.use('/api', routes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Không tìm thấy endpoint' });
});

app.use(errorHandler);

module.exports = app;