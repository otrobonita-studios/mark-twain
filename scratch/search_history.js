const fs = require('fs');
const path = require('path');

const filePath = 'C:/Users/Dindator/.gemini/antigravity-ide/brain/0c082117-90b4-4108-bc1f-cc443905da60/.system_generated/logs/transcript.jsonl';

if (!fs.existsSync(filePath)) {
  console.log("Transcript file does not exist at path: " + filePath);
  process.exit(1);
}

const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

console.log(`Searching ${lines.length} lines in transcript...`);

const keywords = ['Y.M.', 'O.M.', 'What-Is-Man', 'Eve', 'quote', 'conversation-line', 'dialogue'];

lines.forEach((line, index) => {
  if (!line.trim()) return;
  try {
    const obj = JSON.parse(line);
    if (obj.content) {
      const match = keywords.some(k => obj.content.toLowerCase().includes(k.toLowerCase()));
      if (match) {
        console.log(`\n--- Step ${obj.step_index} (${obj.source} - ${obj.type}) ---`);
        console.log(obj.content.substring(0, 1000));
      }
    }
  } catch (e) {
    // Ignore invalid JSON lines
  }
});
