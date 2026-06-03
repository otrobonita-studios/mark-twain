const fs = require('fs');
const path = require('path');

const filePath = 'C:/Users/Dindator/.gemini/antigravity-ide/brain/0c082117-90b4-4108-bc1f-cc443905da60/.system_generated/logs/transcript.jsonl';

if (!fs.existsSync(filePath)) {
  console.log("No transcript file.");
  process.exit(1);
}

const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

lines.forEach((line, index) => {
  if (!line.trim()) return;
  try {
    const obj = JSON.parse(line);
    if (obj.tool_calls) {
      const callsStr = JSON.stringify(obj.tool_calls);
      if (callsStr.includes('copy') || callsStr.includes('cp ') || callsStr.includes('Copy-Item')) {
        console.log(`\n--- Step ${obj.step_index} (${obj.source} - Tool Call) ---`);
        console.log(callsStr);
      }
    }
    if (obj.content && (obj.content.includes('copy') || obj.content.includes('cp ') || obj.content.includes('Copy-Item'))) {
      console.log(`\n--- Step ${obj.step_index} (${obj.source} - Content) ---`);
      console.log(obj.content.substring(0, 1000));
    }
  } catch (e) {
  }
});
