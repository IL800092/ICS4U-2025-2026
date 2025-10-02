// if_statements.js

const prompt = require('prompt-sync')(); // Import the 'prompt-sync' module to use prompt

function checkTemperature(temperature) {
    if (temperature > 30) {
        console.log('It is hot outside.');
    } else if (temperature > 20) {
        console.log('It is warm outside.');
    } else {
        console.log('It is cold outside.');
    }
}

// Use prompt to get user input
let temp = parseFloat(prompt('Enter the temperature: '));
checkTemperature(temp);
