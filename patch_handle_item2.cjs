const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// The logic we want to replace for TikTok (line 797)
const oldTikTok = `      setAnxietyLevel((prevVal) => {
        const nextVal = Math.max(0, Math.min(100, prevVal + 3));
        return nextVal;
      });`;
const newTikTok = `      setAnxietyLevel((prevVal) => {
        let penalty = 3;
        if (playerSkills.resilience === 1) penalty = 2;
        if (playerSkills.resilience === 2) penalty = 1;
        const nextVal = Math.max(0, Math.min(100, prevVal + penalty));
        return nextVal;
      });`;

code = code.replace(oldTikTok, newTikTok);

// For CardNotificacao (line 814)
const oldCard = `      setAnxietyLevel((prevVal) => {
        const nextVal = Math.max(0, Math.min(100, prevVal + cardDelta));
        return nextVal;
      });`;
const newCard = `      setAnxietyLevel((prevVal) => {
        let penalty = cardDelta;
        if (playerSkills.resilience === 1) penalty = Math.max(1, cardDelta - 2);
        if (playerSkills.resilience === 2) penalty = Math.max(1, cardDelta - 4);
        const nextVal = Math.max(0, Math.min(100, prevVal + penalty));
        return nextVal;
      });`;

code = code.replace(oldCard, newCard);

// For Generic Harmful (line 844)
const oldGeneric = `        setAnxietyLevel((prevVal) => {
          const nextVal = Math.max(0, Math.min(100, prevVal + actualDelta));
          return nextVal;
        });`;
const newGeneric = `        setAnxietyLevel((prevVal) => {
          let penalty = actualDelta;
          if (playerSkills.resilience === 1) penalty = Math.max(1, actualDelta - 2);
          if (playerSkills.resilience === 2) penalty = Math.max(1, actualDelta - 4);
          const nextVal = Math.max(0, Math.min(100, prevVal + penalty));
          return nextVal;
        });`;

code = code.replace(oldGeneric, newGeneric);

fs.writeFileSync('src/App.tsx', code);
console.log('Patched handleItemCollect for all harmful items');
