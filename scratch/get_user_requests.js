const fs = require('fs');
const path = require('path');

const filePath = 'C:/Users/Dindator/.gemini/antigravity-ide/brain/0c082117-90b4-4108-bc1f-cc443905da60/.system_generated/logs/transcript.jsonl';

if (!fs.existsSync(filePath)) {
  console.log("Transcript file does not exist at path: " + filePath);
  process.exit(1);
}

const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

lines.forEach((line, index) => {
  if (!line.trim()) return;
  try {
    const obj = JSON.parse(line);
    if (obj.type === 'USER_INPUT') {
      console.log(`\n================ STEP ${obj.step_index} ================\n`);
      console.log(obj.content);
    }
  } catch (e) {
  }
});
