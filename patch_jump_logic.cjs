const fs = require('fs');
let code = fs.readFileSync('src/components/ThreeCanvas.tsx', 'utf8');

const declarationsMatch = `    let playerJumpY = 0;
    let playerJumpVelocity = 0;
    let isGrounded = true;`;

const newDeclarations = `    let playerJumpY = 0;
    let playerJumpVelocity = 0;
    let isGrounded = true;
    let jumpsCount = 0;
    let prevJumpRequested = false;`;

code = code.replace(declarationsMatch, newDeclarations);

const jumpLogicMatch = `      // Jump Takeoff Impulse (Super Salto com alta impulsão para saltar sobre obstáculos e alcançar itens altos)
      if (jumpRequested && isGrounded && !crouchRequested) {
        playerJumpVelocity = 23.5; // Impulse reaching ~6.2 units apex height (mais do que o dobro do salto anterior)
        isGrounded = false;
      }`;

const newJumpLogic = `      // Jump Takeoff Impulse (Super Salto com alta impulsão para saltar sobre obstáculos e alcançar itens altos)
      const justJumped = jumpRequested && !prevJumpRequested;
      prevJumpRequested = jumpRequested;

      if (justJumped && isGrounded && !crouchRequested) {
        playerJumpVelocity = 23.5; // Impulse reaching ~6.2 units apex height
        isGrounded = false;
        jumpsCount = 1;
      } else if (justJumped && !isGrounded && jumpsCount === 1 && playerSkills?.doubleJump) {
        playerJumpVelocity = 20.0; // Pulo duplo!
        jumpsCount = 2;
        // Adiciona um pequeno squash para dar o feel do pulo no ar
        landingSquashTimer = 0.08; 
      }`;

code = code.replace(jumpLogicMatch, newJumpLogic);

// Add magnet logic
const coinMatch = `              if (item.collected) {
                meshGroup.visible = false;
              } else {
                meshGroup.visible = true;
                if (distX < 2.2 && playerJumpY < 3.5) {`;

const newCoinMatch = `              if (item.collected) {
                meshGroup.visible = false;
              } else {
                meshGroup.visible = true;
                const magnetRadius = (item.type === 'MoedaOuro' && playerSkills?.magnet) ? 8.0 : 2.2;
                if (distX < magnetRadius && playerJumpY < 3.5) {`;

code = code.replace(coinMatch, newCoinMatch);

fs.writeFileSync('src/components/ThreeCanvas.tsx', code);
console.log('Patched jump and magnet logic');
