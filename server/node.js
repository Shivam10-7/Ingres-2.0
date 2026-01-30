require('dotenv').config(); // Injected the .env file
const express = require('express');
const app = express()

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(8081, () => {
    console.log("http://localhost:8081");
})