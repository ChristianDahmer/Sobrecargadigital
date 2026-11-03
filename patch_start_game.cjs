const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldLogic = `  const handleStartGame = () => {
    playButtonClickSFX(soundEnabled);
    initAudio();
    stopSpeech();`;

const newLogic = `  const handleStartGame = () => {
    playButtonClickSFX(soundEnabled);
    initAudio();
    stopSpeech();
    
    // Shield auto-equip at the start of a run
    if (playerSkills.shield) {
      setIsShieldActive(true);
    } else {
      setIsShieldActive(false);
    }`;

code = code.replace(oldLogic, newLogic);
fs.writeFileSync('src/App.tsx', code);
console.log('Patched handleStartGame for shield equip');
