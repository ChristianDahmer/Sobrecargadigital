const fs = require('fs');
let code = fs.readFileSync('src/components/ThreeCanvas.tsx', 'utf8');

if (!code.includes('playerSkills?: PlayerSkills;')) {
  // Add import if needed
  if (!code.includes('PlayerSkills')) {
    code = code.replace(`import { GameState, FallingItem, GameSettings } from '../types';`, `import { GameState, FallingItem, GameSettings, PlayerSkills } from '../types';`);
  }

  code = code.replace(`  goldCoinsCount?: number;
}`, `  goldCoinsCount?: number;
  playerSkills?: PlayerSkills;
}`);

  code = code.replace(`  showMedicinePurchaseModal,
  graceTimer,
  goldCoinsCount
}) => {`, `  showMedicinePurchaseModal,
  graceTimer,
  goldCoinsCount,
  playerSkills
}) => {`);

  fs.writeFileSync('src/components/ThreeCanvas.tsx', code);
  console.log('Patched ThreeCanvas interface');
}
