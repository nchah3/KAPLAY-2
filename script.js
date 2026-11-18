nn.on("load", () => {
  kaplay({
    background: "#8cc1fa",
  });

  // Enable Gravity //
  setGravity(1200);

  // Load Audio Files //
  loadSound("collect", "media/audio/collect.wav");
  loadSound("soundtrack", "media/audio/soundtrack.mp3");
  loadSound("jump", "media/audio/jump.mp3");

  // Load Sprites //
  loadSprite("player", "media/sprites/postal-worker.png");
  loadSprite("envelope", "media/sprites/envelope.png");
  loadSprite("shippingBox", "media/sprites/shipping-box.png");

  // Start Background Music //
  play("soundtrack", {
    loop: true,
    volume: 0.05,
  });

  // Levels //
  const levels = ["air", "land", "water"];

  // Player //
  const player = add([
    sprite("player"),
    scale(1 / 12),
    pos(0, -300),
    area(),
    body(),
    stay(),
    "player",
    { speed: 600, fallHeight: Infinity, level: 0 },
  ]);

  // Stopwatch Timer //
  const timer = add([
    text("00:00"),
    pos(24, 24),
    { value: 0, isRunning: false },
    fixed(),
    stay(),
  ]);

  // Packages Counter //
  const packageCounter = add([
    text("Remaining Packages:"),
    pos(24, 56),
    { value: 0 },
    fixed(),
    stay(),
  ]);

  // Moving Left //
  player.onKeyDown("a", () => {
    player.move(-player.speed, 0);
  });

  // Moving Right //
  player.onKeyDown("d", () => {
    player.move(player.speed, 0);
  });

  // Jumping //
  player.onKeyDown("space", () => {
    // Only if player is touching the ground //
    if (player.isGrounded()) {
      play("jump", {
        volume: 0.5,
      });
      player.jump(800);
    }
  });

  // Testing for Level Building //
  player.onKeyPress("f", () => {
    console.log(`${player.pos.x}, ${player.pos.y}`);
  });

  // Collecting Package //
  player.onCollide("collectable", (item, col) => {
    // Play sound //
    play("collect", {
      volume: 0.3,
    });

    // Add item to player inventory //
    item.use(follow(player, vec2(rand(20), 50 + rand(20))));
    item.scaleBy(0.7);

    // Increment Packages Count //
    packageCounter.value--;
    packageCounter.text = "Remaining Packages: " + packageCounter.value;

    // Change Office Status //
    if (packageCounter.value === 0) {
      get("office")[0].color = rgb(48, 145, 53);
    }
  });

  // Hitting Entity or Obstacle //
  player.onCollide("obstacle", (object, col) => {
    resetPlayer();
  });

  // End The Game //
  player.onCollide("office", () => {
    if (!packageCounter.value) {
      // Stop Timer //
      timer.isRunning = false;

      // Destroy Packages //
      get("collectable").forEach((package) => {
        destroy(package);
      });

      // Move to the next Level //
      player.level++;
      go(levels[player.level]);
    }
  });

  player.onUpdate(() => {
    // Update timer and format in mm:ss.ms format //
    if (timer.isRunning) {
      timer.value += dt();

      let seconds = Math.floor(timer.value % 60);
      let milliseconds = Math.floor((timer.value % 1) * 100);
      let minutes = Math.floor(timer.value / 60);

      timer.text = `${minutes < 10 ? "0" + minutes : minutes}:${seconds < 10 ? "0" + seconds : seconds}.${milliseconds < 10 ? "0" + milliseconds : milliseconds}`;
    }

    // Respawn player if they fall off of the map //
    if (player.pos.y > player.fallHeight) {
      resetPlayer();
    }

    // Position the camera to follow the player //
    setCamPos(player.pos);
  });

  // Reset Player //
  function resetPlayer() {
    player.pos = vec2(0, -300);
    player.vel = vec2(0);
  }

  // Generate Platforms //
  function generatePlatforms(platformArray, type) {
    const height = 220;

    // Go through each level //
    platformArray.forEach((level, levelHeight) => {
      // Return if its empty //
      if (level.length === 0) return;

      // Add single block //
      if (level.length === 1) {
        add([
          pos(0, levelHeight * height),
          sprite(`${type}-round`),
          scale(1 / 4),
          area(),
          body({ isStatic: true }),
        ]);
      } else {
        // Otherwise loop through elements //
        for (let platform = 0; platform < level.length; platform++) {
          switch (level[platform].toLowerCase()) {
            // Right Block //
            case "r":
              add([
                pos(platform * 199, levelHeight * height),
                sprite(`${type}-sharp-r`),
                scale(1 / 6),
                area(),
                body({ isStatic: true }),
              ]);
              break;
            // Left Block //
            case "l":
              add([
                pos(platform * 199, levelHeight * height),
                sprite(`${type}-sharp-l`),
                scale(1 / 6),
                area(),
                body({ isStatic: true }),
              ]);
              break;
            // Middle Block //
            case "m":
              add([
                pos(platform * 199, levelHeight * height),
                sprite(`${type}-sharp`),
                scale(1 / 6),
                area(),
                body({ isStatic: true }),
              ]);
              break;

            // Single Block //
            case "s":
              add([
                pos(platform * 199, levelHeight * height),
                sprite(`${type}-round`),
                scale(1 / 6),
                area(),
                body({ isStatic: true }),
              ]);
              break;
            default:
              break;
          }

          // Add Postal Office //
          if (
            level[platform] === level[platform].toUpperCase() &&
            level[platform] !== " "
          ) {
            add([
              pos(platform * 199, levelHeight * height - 100),
              rect(100, 100),
              color(145, 145, 145),
              area(),
              body({ isStatic: true }),
              "office",
            ]);
          }
        }
      }

      // Set the fall height according to the generated level //
      player.fallHeight = levelHeight * height * 2;
    });
  }

  scene("air", () => {
    // Load Sprites //
    loadSprite("bird", "media/enemies/bird.png");
    loadSprite("cloud-round", "media/platforms/cloud/cloud-round.png");
    loadSprite("cloud-sharp-r", "media/platforms/cloud/cloud-sharp-r.png");
    loadSprite("cloud-sharp-l", "media/platforms/cloud/cloud-sharp-l.png");
    loadSprite("cloud-sharp", "media/platforms/cloud/cloud-sharp.png");

    // Set Package Counter //
    packageCounter.value = 2;
    packageCounter.text = `Remaining Packages: ${packageCounter.value}`;

    // Add Platforms //
    generatePlatforms(
      ["lmmr  lmr s", "  lmr  lmmr", "lmr lmr lmr lmr", "s  s  s  s  lmR"],
      "cloud",
    );
    // Add Decorations //

    // Add Obstacles //

    // Add Enemy //
    add([sprite("bird"), scale(1 / 8), pos(400, -50), area(), "obstacle"]);
    add([sprite("bird"), scale(1 / 8), pos(1750, 170), area(), "obstacle"]);

    // Add Packages //
    add([
      sprite("envelope"),
      pos(2200, 160),
      scale(1 / 10),
      area(),
      "collectable",
    ]);

    add([
      sprite("shippingBox"),
      pos(-540, 410),
      scale(1 / 10),
      area(),
      "collectable",
    ]);
  });

  scene("land", () => {
    // Load Sprites //
    loadSprite("grass-round", "media/platforms/grass/grass-round.png");
    loadSprite("grass-sharp-l", "media/platforms/grass/grass-sharp-r.png");
    loadSprite("grass-sharp-r", "media/platforms/grass/grass-sharp-l.png");
    loadSprite("grass-sharp", "media/platforms/grass/grass-sharp.png");

    // Set Package Counter //
    packageCounter.value = 4;
    packageCounter.text = `Remaining Packages: ${packageCounter.value}`;

    // Add Platforms //
    generatePlatforms(["lmmmmmmMr"], "grass");

    // Add Decorations //
    setBackground(77, 163, 255);

    // Add Obstacles //

    // Add Enemies //

    // Add Packages //

    // Add Postal Office //
  });

  scene("water", () => {
    // Set Package Counter //
    packageCounter.value = 4;
    packageCounter.text = `Remaining Packages: ${packageCounter.value}`;

    // Add Platforms //

    // Add Decorations //

    // Add Obstacles //

    // Add Enemies //

    // Add Packages //

    // Add Postal Office //
  });

  go("air");
  timer.isRunning = true;
});
