require('dotenv').config(); // Injected the .env file
const express = require('express');
const app = express()
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
app.use(express.json());
app.use(cookieParser());

// mongodb connection
console.log("This is the mongo url node "+process.env.MONGO_URI)
 mongoose.connect(process.env.MONGO_URI)
 .then(() => console.log("MongoDB connected"))
 .catch((err) => console.log("MongoDB connection error:", err));

app.get('/', (req, res) => {
    res.send('Hello World!')
})

// this is the route for the authorization
app.use('/auth', require('./src/routes/middleware/auth'));

app.listen(8081, () => {
    console.log("http://localhost:8081");
})