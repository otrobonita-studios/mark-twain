const fs = require('fs');
const path = require('path');

const filePath = 'C:/Users/Dindator/.gemini/antigravity-ide/brain/0c082117-90b4-4108-bc1f-cc443905da60/.system_generated/logs/transcript.jsonl';

if (!fs.existsSync(filePath)) {
  console.log("No transcript file.");
  process.exit(1);
}

const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

lines.forEach((line) => {
  if (!line.trim()) return;
  try {
    const obj = JSON.parse(line);
    // Print steps from index 2800 to 2890
    if (obj.step_index >= 2800 && obj.step_index <= 2890) {
      if (obj.type === 'USER_INPUT' || obj.type === 'PLANNER_RESPONSE' || obj.type === 'TEXT') {
        console.log(`\n--- Step ${obj.step_index} (${obj.source} - ${obj.type}) ---`);
        console.log(obj.content);
      }
    }
  } catch (e) {
  }
});
