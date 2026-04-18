require('dotenv').config(); // Injected the .env file
const express = require('express');
const app = express()
const cors = require('cors');
const AuthJwt = require('./src/routes/middleware/AuthJWT');
const PieChartPayloadd = require('./src/routes/ChartData/PieChart');
const BarChartPayload = require('./src/routes/ChartData/BarChart');
const LineChart  = require('./src/routes/ChartData/LineChart');// Ensure this is correctly imported for use in the tester route
const mongoose = require('mongoose');
// const WebSocket = require('ws');
const Database = require('./src/routes/db/dataRetrive');
const cookieParser = require('cookie-parser');
// const http = require('http');
const chartDeterminer = require('./src/routes/Modules/ChartDeterminer'); // Ensure this is correctly imported for use in dataRetrive.js
const RequestLock = require('./src/routes/middleware/RequestLock')
// Create an HTTP server using the Express app
// const server = http.createServer(app);
const mysql = require("mysql2"); // Keep the import for the connection block
const classifier = require('./src/routes/classifier');
// const { stat } = require('fs');

mongoose.connect(process.env.MONGO_URI)
.then(() => {
    console.log("✅ MongoDB connected");
})
.catch((err) => {
    console.log("MongoDB connection error:", err);
});

// connection with the MYSQL
const con = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
});
// Trying connection with the MYSQL
con.connect(function (err) {
    if (err) {
        console.warn("MySQL connection failed (continuing without DB):", err.message);
    } else {
        console.log("✅ MySQL Connected!");
    }
});

// Attach WebSocket server to SAME HTTP server
// const wss = new WebSocket.Server({ server });

app.use(express.json());
app.use(cookieParser());

// allow cross-origin requests from client (with credentials for cookies)
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:8080',
  'http://localhost:8082',
  'http://10.212.167.242:8080',
  'http://10.212.167.242:8082'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// mongodb connection
// console.log("This is the mongo url node "+process.env.MONGO_URI)
//  mongoose.connect(process.env.MONGO_URI)
//  .then(() => console.log("MongoDB connected"))
//  .catch((err) => console.log("MongoDB connection error:", err));

// app.get('/', (req, res) => {
//     res.send('Hello World!')
// })

// this is the route for the authorization
app.use('/auth', require('./src/routes/middleware/auth'));

// routes for chat history
app.use('/api/chats', require('./src/routes/chatRoutes'));

// these are the routes that we get form the chat
app.post('/chat',AuthJwt,RequestLock, async (req, res) => { 
    // 1. Input Validation: Ensure 'query' actually exists before processing
    const { query, isDetailedResponseNeeded, isVisualizationNeeded } = req.body;

    if (!query || typeof query !== 'string') {
        console.warn("[Chat Route] Rejected: Missing or invalid query string.");
        return res.status(400).json({ error: "A valid query string is required." });
    }

    console.log(`[Chat Route] Processing query: "${query.substring(0, 50)}..."`);
    //Normalizd the query by removing punctuation and extra spaces to help the classifier make better decisions. This is a simple form of preprocessing that can improve the accuracy of the classifier.
    let NormalizedQuery = query.toLowerCase()
    .replace(/[^\w\s]/g, "")   // remove punctuation
    .replace(/\s+/g, " ")     // collapse spaces
    .trim();
    try {

        /**
         * 2. Orchestration:
         * The classifier acts as the router for different logic pipelines.
         * We await the result of the full pipeline execution.
         */
        const response = await classifier(
            isDetailedResponseNeeded, 
            isVisualizationNeeded, 
            NormalizedQuery
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

app.post('/quickchat', (req,res) => {   
    const { query, isVisualizationNeeded} = req.body;
    console.log("Received query:", query);
    const response = classifier(isVisualizationNeeded);
    res.json({ response });
});

app.post('/tester', async (req, res) => { 
    // this  is  for single values that does not generate charts
    // const sql ='SELECT ROUND(AVG(`Stage of Ground Water  Extraction (%)`),2) AS `Stage_of_Extraction` FROM data2023final2 WHERE `State`=\'Maharashtra\';';
    // const sql ='SELECT ROUND((COUNT(CASE WHEN `Categorization` = \'Safe\' THEN 1 END) * 100.0 / COUNT(*)), 2) AS `Percentage_Safe_Units` FROM data2024final2 WHERE `State` = \'Maharashtra\';'
    // This makes Pieechart
    // const sql = "SELECT Categorization, COUNT(*) AS Count FROM data2023final2 WHERE District = 'Bathinda' GROUP BY Categorization;";
    
    // this is for the bar chart
    // const sql = "SELECT `district`, ROUND(AVG(`stage of ground water extraction (%)`), 2) AS `Avg_Extraction_Stage` FROM ingresdata2025 WHERE `state` = 'rajasthan' GROUP BY `district` LIMIT 25;";
    // // this is for pie chart
    // const sql ="SELECT categorization, COUNT(*) AS Total_Assessment_Units FROM ingresdata2025 GROUP BY categorization;"
    // this is for line chart
    const sql ="SELECT district, ROUND(AVG(`stage of ground water extraction (%)`), 2) AS Avg_Extraction_Stage FROM ingresdata2025 GROUP BY district LIMIT 100;"
    const [rows, fields, ChartType] = await Database(sql);
    let result ='';
    const chartType = (ChartType && ChartType.chartType) || (ChartType && ChartType.type) || 'table';
    console.log("Determined chart type:", chartType);
   switch (chartType) {
    case 'KPI':
        result = {
            type: 'KPI',
            data: rows
        };
        break;

    case 'pie':
        result = {
            type: 'pie',
            data: await PieChartPayloadd(rows, "THIS IS THE TITLE")
        };
        break;

     case 'line':
        result = {
            type: 'line',
            shivam: "correctly reached the line chart case",
            data: await LineChart(rows, "THIS IS THE TITLE")
        };
        break;

    case 'bar':
        result = {
            type: 'bar',
            // Suggestion: Use your BarChartPayload here similar to the pie chart
            data: await BarChartPayload(rows, "THIS IS THE TITLE")
        };
        break;

    default:
        result = {
            type: 'table',
            data: rows,
         
            
        };
        break; // Technically optional for default, but good practice
}

// Use a comma instead of '+' to see the actual object structure in terminal
console.log("Final result being sent to client:", result);

// Explicitly ensure result is an object before sending
if (result && typeof result === 'object') {
    return res.status(200).json(result);
} else {
    return res.status(500).json({ error: "Result is not a valid object", received: result });
}
});


app.post('/dataQuery/test', async (req, res) => { 
       // 1. Input Validation: Ensure 'query' actually exists before processing
    const { query, isDetailedResponseNeeded, isVisualizationNeeded } = req.body;

    if (!query || typeof query !== 'string') {
        console.warn("[Chat Route] Rejected: Missing or invalid query string.");
        return res.status(400).json({ error: "A valid query string is required." });
    }

    console.log(`[Chat Route] Processing query: "${query.substring(0, 50)}..."`);
    //Normalizd the query by removing punctuation and extra spaces to help the classifier make better decisions. This is a simple form of preprocessing that can improve the accuracy of the classifier.
    let NormalizedQuery = query.toLowerCase()
    .replace(/[^\w\s]/g, "")   // remove punctuation
    .replace(/\s+/g, " ")     // collapse spaces
    .trim();
    try {

        /**
         * 2. Orchestration:
         * The classifier acts as the router for different logic pipelines.
         * We await the result of the full pipeline execution.
         */
        const response = await classifier(
            isDetailedResponseNeeded, 
            isVisualizationNeeded, 
            NormalizedQuery
        );

        // 3. Success Response: Send back the structured JSON
        res.status(200).json({ 
            success: true,
            response 
        });
    } catch (error) {
        console.error("Fuck of this is just testing", error);
        res.status(500).json({ error: "Query banane me vaat lag gayii" });
    }
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
// wss.on("connection", (ws, req) => {
//     console.log("New WebSocket connection");

//     // When a client connects, send a welcome message
//     ws.send(JSON.stringify({ type: "welcome", message: "connected" }));

//     ws.on("message", (message) => {
//         try {
//             const dataRaw = message.toString();
//             console.log("Received from client:", dataRaw);

//             // If client is asking to broadcast a payload to all clients, forward it
//             try {
//                 const parsed = JSON.parse(dataRaw);
//                 const shouldBroadcast = parsed && (parsed.broadcast === true || parsed.success === true || parsed.type === "broadcast");
//                 if (shouldBroadcast) {
//                     const text = JSON.stringify(parsed);
//                     Array.from(wss.clients)
//                         .filter((c) => c.readyState === WebSocket.OPEN)
//                         .forEach((c) => c.send(text));
//                 }
//             } catch (err) {
//                 // not JSON or cannot parse — ignore
//             }
//         } catch (err) {
//             console.error("Failed to process message", err);
//         }
//     });

//     ws.on("close", () => {
//         console.log("Client disconnected");
//     });
// });

// // Broadcast synthetic realtime chart data to all connected clients every second
// setInterval(() => {
//     const clients = Array.from(wss.clients).filter((c) => c.readyState === WebSocket.OPEN);
//     if (!clients.length) return;

//     // Example payload: update one or more charts with random values
//     const payload = {
//         type: "chart_update",
//         timestamp: Date.now(),
//         charts: [
//             {
//                 title: "Real-time Series",
//                 xAxis: { data: Array.from({ length: 10 }, (_, i) => `${i}`) },
//                 series: [
//                     { name: "Series A", data: Array.from({ length: 10 }, () => Math.round(Math.random() * 100)) },
//                     { name: "Series B", data: Array.from({ length: 10 }, () => Math.round(Math.random() * 100)) },
//                 ],
//                 chartType: "line",
//             },
//         ],
//     };

//     const text = JSON.stringify(payload);
//     clients.forEach((c) => c.send(text));
// }, 1000);

app.listen(8081, () => {
    console.log("http://localhost:8081");
})