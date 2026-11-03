const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf8');

if (!code.includes('PlayerSkills')) {
  code += `\nexport interface PlayerSkills {
  doubleJump: boolean;
  shield: boolean;
  magnet: boolean;
  resilience: number;
}\n`;
  fs.writeFileSync('src/types.ts', code);
}
