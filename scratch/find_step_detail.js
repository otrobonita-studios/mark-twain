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
    if (obj.step_index <= 350) {
      const callsStr = obj.tool_calls ? JSON.stringify(obj.tool_calls) : '';
      const hasVol1 = callsStr.includes('Volume-1.html') || (obj.content && obj.content.includes('Volume-1.html'));
      const hasCopy = callsStr.includes('cp') || callsStr.includes('Copy-Item') || callsStr.includes('copy') ||
                      (obj.content && (obj.content.includes('copy') || obj.content.includes('cp ')));
      if (hasVol1 || (hasCopy && (callsStr.includes('books') || (obj.content && obj.content.includes('books'))))) {
        console.log(`\n--- Step ${obj.step_index} (${obj.source} - ${obj.type}) ---`);
        if (obj.content) console.log('Content:', obj.content.substring(0, 300));
        if (obj.tool_calls) console.log('Tool Calls:', JSON.stringify(obj.tool_calls));
      }
    }
  } catch (e) {
  }
});
