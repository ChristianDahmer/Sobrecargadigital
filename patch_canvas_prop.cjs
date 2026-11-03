const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const canvasMatch = `              <ThreeCanvas
                gameState={gameState}
                gameTimer={gameTimer}
                anxietyLevel={anxietyLevel}`;

const canvasNew = `              <ThreeCanvas
                gameState={gameState}
                gameTimer={gameTimer}
                anxietyLevel={anxietyLevel}
                playerSkills={playerSkills}`;

code = code.replace(canvasMatch, canvasNew);
fs.writeFileSync('src/App.tsx', code);
console.log('Patched ThreeCanvas prop');
