// this is dataquery routes
const { model } = require('mongoose');
const SQLGen = require('../Modules/SQLGen');
const database = require('../db/dataRetrive');
async function dataqueryHandler(Query){
    const SQLJson = await SQLGen(Query);
    const sqlQuery = SQLJson.sql;
    console.log("Generated SQL Query:", sqlQuery);
    process.exit(0);
 
}
module.exports = dataqueryHandler;