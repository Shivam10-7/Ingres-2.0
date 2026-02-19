require('dotenv').config(); // Injected the .env file
const express = require('express');
const app = express()
const mongoose = require('mongoose');
const WebSocket = require('ws');
const cookieParser = require('cookie-parser');
const http = require('http');
const chartDeterminer = require('./src/routes/Modules/ChartDeterminer'); // Ensure this is correctly imported for use in dataRetrive.js
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
app.post('/chat', async (req, res) => { 
    // 1. Input Validation: Ensure 'query' actually exists before processing
    const { query, isDetailedResponseNeeded, isVisualizationNeeded } = req.body;

    if (!query || typeof query !== 'string') {
        console.warn("[Chat Route] Rejected: Missing or invalid query string.");
        return res.status(400).json({ error: "A valid query string is required." });
    }

    console.log(`[Chat Route] Processing query: "${query.substring(0, 50)}..."`);

    try {
        /**
         * 2. Orchestration:
         * The classifier acts as the router for different logic pipelines.
         * We await the result of the full pipeline execution.
         */
        const response = await classifier(
            isDetailedResponseNeeded, 
            isVisualizationNeeded, 
            query
        );

        // 3. Success Response: Send back the structured JSON
        res.status(200).json({ 
            success: true,
            response 
        });

    } catch (error) {
        /**
         * 4. Global Error Catch:
         * Prevents the server from crashing if the AI or Database fails.
         */
        console.error("[Chat Route Error]:", error.message);
        
        res.status(500).json({ 
            success: false,
            error: "Internal Server Error",
            message: "I encountered an issue processing your request. Please try again."
        });
    }
});


app.post('/tester', async (req, res) => { 
    // 1. Input Validation: Ensure 'query' actually exists before processing
    const { query, isDetailedResponseNeeded, isVisualizationNeeded } = req.body;
    const sql ='SELECT ROUND(AVG(`Stage of Ground Water  Extraction (%)`),2) AS `Stage_of_Extraction` FROM data2023final2 WHERE `State`=\'Maharashtra\';';

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