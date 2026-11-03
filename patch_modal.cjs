const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const navBarMatch = `<Navbar
                gameState={gameState}
                onLogoClick={() => setActiveTab('informacoes')}
                setShowQrModal={setShowQrModal}
                onOpenControlPanel={() => setIsControlPanelOpen(true)}
                onOpenHistory={() => setShowHistoryModal(true)}
              />`;

const newNavBar = `<Navbar
                gameState={gameState}
                onLogoClick={() => setActiveTab('informacoes')}
                setShowQrModal={setShowQrModal}
                onOpenControlPanel={() => setIsControlPanelOpen(true)}
                onOpenHistory={() => setShowHistoryModal(true)}
                onOpenShop={() => setShowShopModal(true)}
              />`;

if (code.includes(navBarMatch)) {
  code = code.replace(navBarMatch, newNavBar);
} else {
  // Try partial
  code = code.replace(`onOpenHistory={() => setShowHistoryModal(true)}`, `onOpenHistory={() => setShowHistoryModal(true)}\n                onOpenShop={() => setShowShopModal(true)}`);
}

const modalPlacement = `{/* History Modal */}`;
const newModalPlacement = `{/* Skill Shop Modal */}
      <SkillShopModal
        isOpen={showShopModal}
        onClose={() => setShowShopModal(false)}
        playerSkills={playerSkills}
        onSkillsUpdate={setPlayerSkills}
        coins={goldCoinsCount}
        onCoinsUpdate={setGoldCoinsCount}
      />
      
      {/* History Modal */}`;

code = code.replace(modalPlacement, newModalPlacement);

fs.writeFileSync('src/App.tsx', code);
console.log('Patched modal inclusion');
