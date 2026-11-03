const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldLogic = `      if (gameSettings.invincibleTrainingMode) {
        return;
      }
      playObstacleHitSFX(soundEnabled);
      setAnxietyLevel((prevVal) => {
        const nextVal = Math.max(0, Math.min(100, prevVal + 10));
        return nextVal;
      });`;

const newLogic = `      if (gameSettings.invincibleTrainingMode) {
        return;
      }
      
      if (isShieldActive) {
        setIsShieldActive(false);
        playCollectWellnessSFX(soundEnabled); // Or a shield break sound
        setLastChoiceFeedback({
          type: 'SIM',
          message: '🛡️ ESCUDO DIGITAL ATIVADO! Dano evitado.',
        });
        setTimeout(() => setLastChoiceFeedback(null), 2000);
        return; // Skip anxiety penalty
      }
      
      playObstacleHitSFX(soundEnabled);
      
      setAnxietyLevel((prevVal) => {
        let penalty = 10;
        if (playerSkills.resilience === 1) penalty = 7;
        if (playerSkills.resilience === 2) penalty = 5;
        const nextVal = Math.max(0, Math.min(100, prevVal + penalty));
        return nextVal;
      });`;

code = code.replace(oldLogic, newLogic);

// Add dependencies to useCallback if needed
const oldDep = `  }, [gameSettings, soundEnabled]);`;
const newDep = `  }, [gameSettings, soundEnabled, isShieldActive, playerSkills.resilience]);`;
code = code.replace(oldDep, newDep);

fs.writeFileSync('src/App.tsx', code);
console.log('Patched handleItemCollect');
