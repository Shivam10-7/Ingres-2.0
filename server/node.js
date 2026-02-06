require('dotenv').config(); // Injected the .env file
const express = require('express');
const app = express()
const mongoose = require('mongoose');
const WebSocket = require('ws');
const cookieParser = require('cookie-parser');
const http = require('http');
// Create an HTTP server using the Express app
const server = http.createServer(app);

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

// WebSocket connection handling
wss.on("connection", (ws, req) => {
    console.log("New WebSocket connection");

    ws.on("message", (message) => {
        console.log("Received:", message.toString());

        // Echo message back
        ws.send("Server received: " + message);
    });

    ws.on("close", () => {
        console.log("Client disconnected");
    });
});

server.listen(8081, () => {
    console.log("http://localhost:8081");
})