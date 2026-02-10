require('dotenv').config(); // Injected the .env file
const express = require('express');
const app = express()
const mongoose = require('mongoose');
const WebSocket = require('ws');
const cookieParser = require('cookie-parser');
const http = require('http');
// Create an HTTP server using the Express app
const server = http.createServer(app);
const mysql = require("mysql2"); // Keep the import for the connection block
const classifier = require('./src/routes/classifier');
// connection with the MYSQL
const con = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
});
// Trying connection with the MYSQL
con.connect(function (err) {
    if (err) throw err;
    console.log("✅ MySQL Connected!");
});

// Attach WebSocket server to SAME HTTP server
const wss = new WebSocket.Server({ server });

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

// these are the routes that we get form the chat
app.post('/chat', (req,res) => {   
    const { query, isDetailedResponseNeeded, isVisualizationNeeded} = req.body;
    console.log("Received query:", query);
    const response = classifier(isDetailedResponseNeeded, isVisualizationNeeded);// This is the response that we get from the classifier and then we will use this response to call the respective pipeline and then we will return the response to the user
    res.json({ response });
});

app.post('/quickchat', (req,res) => {   
    const { query, isVisualizationNeeded} = req.body;
    console.log("Received query:", query);
    const response = classifier(isVisualizationNeeded);
    res.json({ response });
});

// WebSocket connection handling 😎😎the websocket is closed for now
// wss.on("connection", (ws, req) => {
//     console.log("New WebSocket connection");

//     ws.on("message", (message) => {
//         console.log("Received:", message.toString());

//         // Echo message back
//         ws.send("Server received: " + message);
//     });

//     ws.on("close", () => {
//         console.log("Client disconnected");
//     });
// });

server.listen(8081, () => {
    console.log("http://localhost:8081");
})