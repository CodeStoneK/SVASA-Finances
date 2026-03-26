const fs = require('fs');
const pdf = require('pdf-parse');

const pdfPath = "C:\\Users\\ranga\\Code\\SvasaFinances\\frontend\\app\\reports\\templates\\Devotee Spl Ack 2025 - JANGA REDDY.pdf";

let dataBuffer = fs.readFileSync(pdfPath);

pdf(dataBuffer).then(function(data) {
    console.log(data.text);
}).catch(function(error) {
    console.error("Error reading PDF:", error);
});
