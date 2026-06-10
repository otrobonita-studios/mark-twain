const fs = require('fs');
const path = require('path');

const htmlFile = 'e:/development/mark-twain/src/data/books/Hadleyberg-Stories-et-al.html';
const jsonFile = 'e:/development/mark-twain/src/data/books/json/Hadleyberg-Stories-et-al.json';

console.log("Applying Hadleyburg Mojibake corrections...");

// Fix HTML
if (fs.existsSync(htmlFile)) {
  const htmlContent = fs.readFileSync(htmlFile, 'utf8');
  let fixedHtml = htmlContent;
  fixedHtml = fixedHtml.replace(/"™/g, '’');
  fixedHtml = fixedHtml.replace(/"”/g, '—');
  fixedHtml = fixedHtml.replace(/"˜/g, '‘');
  fixedHtml = fixedHtml.replace(/"\x9D/g, '”');
  
  fs.writeFileSync(htmlFile, fixedHtml, 'utf8');
  console.log("Updated Hadleyberg-Stories-et-al.html successfully.");
} else {
  console.error("HTML file not found!");
}

// Fix JSON
if (fs.existsSync(jsonFile)) {
  const jsonContent = fs.readFileSync(jsonFile, 'utf8');
  let fixedJson = jsonContent;
  fixedJson = fixedJson.replace(/\\\"™/g, '’');
  fixedJson = fixedJson.replace(/\\\"”/g, '—');
  fixedJson = fixedJson.replace(/\\\"˜/g, '‘');
  fixedJson = fixedJson.replace(/\\\"\x9D/g, '”');
  
  fs.writeFileSync(jsonFile, fixedJson, 'utf8');
  console.log("Updated Hadleyberg-Stories-et-al.json successfully.");
} else {
  console.error("JSON file not found!");
}

console.log("Done!");
