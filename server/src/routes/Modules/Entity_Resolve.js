const { response } = require("express");

const axios = require("axios").default;
async function EntityResolver(userQuery) {
    //here we will send a request to the entity resolver module to get the entities and then we will send the user query along with the system instruction to the local model and get the response and then we will parse the response and return it to the user
    try {
        const response = await axios.post("http://127.0.0.1:8000/resolve-entity", {
            query: userQuery,
            session_id: "12453",//session id should be dynamic and should be the same for the entire conversation
        });
        console.log("Response from Entity Resolver:");
        console.log(response.data);
    } catch (error) {
        console.error(error);
    }

    return response;//here we will return the response from the entity resolver module to the user

}

module.exports = EntityResolver;