nn.on("load", () => {
  kaplay({
    background: "#8cc1fa",
  });

  // Enable Gravity //
  setGravity(1100);

  // Load Audio Files //
  loadSound("collect", "media/audio/collect.wav");
  loadSound("soundtrack", "media/audio/soundtrack.mp3");
  loadSound("jump", "media/audio/jump.mp3");

  // Load Sprites //
  loadSprite("player", "media/sprites/postal-worker.png");
  loadSprite("player-walk", "media/sprites/postal-worker-walk-2.png");
  loadSprite("envelope", "media/sprites/envelope.png");
  loadSprite("shippingBox", "media/sprites/shipping-box.png");
  loadSprite("postalOfficeClosed", "media/sprites/post-office-closed.png");
  loadSprite("postalOfficeOpen", "media/sprites/post-office-open.png");

  // Start Background Music //
  play("soundtrack", {
    loop: true,
    volume: 0.05,
  });

  // Levels //
  const levels = ["air", "land", "water"];
  const numLevels = 7;
  const levelWidth = 20;

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
    if (player.isGrounded()) {
      player.flipX = true;
      player.sprite = "player-walk";
    }
  });

  // Moving Right //
  player.onKeyDown("d", () => {
    player.move(player.speed, 0);
    if (player.isGrounded()) {
      player.sprite = "player-walk";
      player.flipX = false;
    }
  });

  // Jumping //
  player.onKeyDown("space", () => {
    // Only if player is touching the ground //
    if (player.isGrounded()) {
      play("jump", {
        volume: 0.5,
      });
      player.jump(800);
      player.sprite = "player";
    }
  });

  player.onKeyDown("w", () => {
    // Only if player is touching the ground //
    if (player.isGrounded()) {
      play("jump", {
        volume: 0.5,
      });
      player.jump(800);
      player.sprite = "player";
    }
  });

  // Jump Cancel //
  player.onKeyDown("shift", () => {
    if (!player.isGrounded()) {
      player.vel.y = 600;
    }
  });

  player.onKeyDown("s", () => {
    if (!player.isGrounded()) {
      player.vel.y = 600;
    }
  });

  // Gamepad Movement //
  player.onGamepadStick("left", (value) => {
    player.move(player.speed * value.x, 0);
    if (player.isGrounded() && Math.round(value.x) != 0) {
      player.flipX = value.x < 0;
      player.sprite = "player-walk";
    }
  });

  // Gamepad Jump //
  player.onGamepadButtonPress("south", () => {
    if (player.isGrounded()) {
      play("jump", {
        volume: 0.5,
      });
      player.jump(800);
      player.sprite = "player";
    }
  });

  // Gamepad Jump Cancel //
  player.onGamepadButtonPress("east", () => {
    if (!player.isGrounded()) {
      player.vel.y = 600;
    }
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
      get("office")[0].sprite = "postalOfficeOpen";
    }
  });

  // Hitting Entity or Obstacle //
  player.onCollide("obstacle", (object, col) => {
    resetPlayer();
  });

  // End The Game //
  player.onCollide("office", () => {
    if (!packageCounter.value) {
      // Destroy Packages //
      get("collectable").forEach((package) => {
        destroy(package);
      });

      // Move to the next Level //
      if (player.level < 2) {
        player.level++;
        go(levels[player.level]);
      } else {
        timer.isRunning = false;
      }
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
    const height = 250;

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
              sprite("postalOfficeClosed"),
              scale(1 / 7),
              pos(platform * 199, levelHeight * height - 140),
              area(),
              z(-1),
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
    loadSprite("skyscraper", "media/obstacles/skyscraper.png");
    loadSprite("bird", "media/enemies/bird.png");
    loadSprite("cloud-round", "media/platforms/cloud/cloud-round.png");
    loadSprite("cloud-sharp-r", "media/platforms/cloud/cloud-sharp-r.png");
    loadSprite("cloud-sharp-l", "media/platforms/cloud/cloud-sharp-l.png");
    loadSprite("cloud-sharp", "media/platforms/cloud/cloud-sharp.png");
    loadSprite("background", "media/backgrounds/sky-bg.png");

    // Set Background //
    add([sprite("background"), pos(-1000, -1000), z(-10)]);

    // Set Package Counter //
    packageCounter.value = 3;
    packageCounter.text = `Remaining Packages: ${packageCounter.value}`;

    // Add Platforms //
    let genArr = [];
    // Add 7 Levels
    for (let i = 0; i < numLevels; i++) {
      let str = "";
      let lastValue = "";

      // Prodecurally generate random tiles //
      for (let j = 0; j < levelWidth; j++) {
        if (lastValue == "l" || lastValue == "m") {
          str += ["m", "r", "r"][randi(3)];
        } else if (lastValue == "r" || lastValue == "s") {
          str += " ";
        } else {
          str += ["l", " ", "s", " ", "l"][randi(5)];
        }
        lastValue = str[str.length - 1];
      }
      genArr.push(str);
    }

    // Place a Post Office at the end //
    let postOfficeSelection = randi(genArr[0].length);
    while (genArr[genArr.length - 1][postOfficeSelection] == " ") {
      postOfficeSelection = randi(genArr[0].length);
    }
    genArr[genArr.length - 1] =
      genArr[genArr.length - 1].slice(0, postOfficeSelection) +
      genArr[genArr.length - 1][postOfficeSelection].toUpperCase() +
      genArr[genArr.length - 1].slice(postOfficeSelection + 1);
    generatePlatforms(genArr, "cloud");

    // Prodcedurally Generate Packages, Obstacles, and Enemies //
    let obstacleArr = [];
    for (let i = 0; i < numLevels; i++) {
      obstacleArr.push([]);
    }
    obstacleArr[0][0] = "p";
    let packagesNeeded = packageCounter.value;
    let obstaclesNeeded = 8;
    let enemiesNeeded = 15;

    while (packagesNeeded || obstaclesNeeded || enemiesNeeded) {
      let randomLevel = randi(numLevels);
      let randomPos = randi(levelWidth);
      if (
        genArr[randomLevel][randomPos] ===
        genArr[randomLevel][randomPos].toUpperCase()
      )
        continue;
      if (obstacleArr[randomLevel][randomPos]) continue;
      if (packagesNeeded) {
        add([
          sprite("envelope"),
          pos(randomPos * 199, randomLevel * 250 - 40),
          scale(1 / 10),
          area(),
          "collectable",
        ]);
        obstacleArr[randomLevel][randomPos] = "c";
        packagesNeeded--;
      } else if (obstaclesNeeded) {
        add([
          sprite("skyscraper"),
          scale(1 / 7),
          pos(randomPos * 199, randomLevel * 250 - 200),
          area(),
          "obstacle",
          z(-1),
        ]);
        obstacleArr[randomLevel][randomPos] = "o";
        obstaclesNeeded--;
      } else if (enemiesNeeded) {
        add([
          sprite("bird"),
          scale(1 / 8),
          pos(randomPos * 199, randomLevel * 250 - 40 - randi(100)),
          area(),
          "obstacle",
        ]);
        obstacleArr[randomLevel][randomPos] = "e";
        enemiesNeeded--;
      }
    }
  });

  scene("land", () => {
    resetPlayer();
    // Load Sprites //
    loadSprite("grass-round", "media/platforms/grass/grass-round.png");
    loadSprite("grass-sharp-l", "media/platforms/grass/grass-sharp-r.png");
    loadSprite("grass-sharp-r", "media/platforms/grass/grass-sharp-l.png");
    loadSprite("grass-sharp", "media/platforms/grass/grass-sharp.png");
    loadSprite("thornBush", "media/obstacles/thorn-bush.png");
    loadSprite("dog", "media/enemies/dog.png");
    loadSprite("background", "media/backgrounds/land-bg.png");

    // Set Background //
    add([sprite("background"), pos(-1000, -1000), z(-10)]);

    // Set Package Counter //
    packageCounter.value = 3;
    packageCounter.text = `Remaining Packages: ${packageCounter.value}`;

    // Add Platforms //
    let genArr = [];
    // Add 7 Levels
    for (let i = 0; i < numLevels; i++) {
      let str = "";
      let lastValue = "";

      // Prodecurally generate random tiles //
      for (let j = 0; j < levelWidth; j++) {
        if (lastValue == "l" || lastValue == "m") {
          str += ["m", "r", "r"][randi(3)];
        } else if (lastValue == "r" || lastValue == "s") {
          str += " ";
        } else {
          str += ["l", " ", "s", " ", "l"][randi(5)];
        }
        lastValue = str[str.length - 1];
      }
      genArr.push(str);
    }
    let postOfficeSelection = randi(genArr[0].length);
    while (genArr[genArr.length - 1][postOfficeSelection] == " ") {
      postOfficeSelection = randi(genArr[0].length);
    }
    genArr[genArr.length - 1] =
      genArr[genArr.length - 1].slice(0, postOfficeSelection) +
      genArr[genArr.length - 1][postOfficeSelection].toUpperCase() +
      genArr[genArr.length - 1].slice(postOfficeSelection + 1);
    generatePlatforms(genArr, "grass");

    // Prodcedurally Generate Packages, Obstacles, and Enemies //
    let obstacleArr = [[], [], [], [], [], [], []];
    obstacleArr[0][0] = "p";
    let packagesNeeded = packageCounter.value;
    let obstaclesNeeded = 8;
    let enemiesNeeded = 15;

    while (packagesNeeded || obstaclesNeeded || enemiesNeeded) {
      let randomLevel = randi(numLevels);
      let randomPos = randi(levelWidth);
      if (
        genArr[randomLevel][randomPos] ===
        genArr[randomLevel][randomPos].toUpperCase()
      )
        continue;
      if (obstacleArr[randomLevel][randomPos]) continue;
      if (packagesNeeded) {
        add([
          sprite("envelope"),
          pos(randomPos * 199, randomLevel * 250 - 40),
          scale(1 / 10),
          area(),
          "collectable",
        ]);
        obstacleArr[randomLevel][randomPos] = "c";
        packagesNeeded--;
      } else if (obstaclesNeeded) {
        if (genArr[randomLevel][randomPos] == " ") continue;
        add([
          sprite("thornBush"),
          scale(1 / 10),
          pos(randomPos * 199, randomLevel * 250 - 45),
          area(),
          "obstacle",
          z(-1),
        ]);
        obstacleArr[randomLevel][randomPos] = "o";
        obstaclesNeeded--;
      } else if (enemiesNeeded) {
        if (genArr[randomLevel][randomPos] == " ") continue;
        add([
          sprite("dog"),
          scale(1 / 8),
          pos(randomPos * 199 + randi(100), randomLevel * 250 - 64),
          area(),
          "obstacle",
        ]);
        obstacleArr[randomLevel][randomPos] = "e";
        enemiesNeeded--;
      }
    }
  });

  scene("water", () => {
    resetPlayer();
    // Load Sprites //
    loadSprite("seaweed", "media/obstacles/seaweed.png");
    loadSprite("pufferfish", "media/enemies/pufferfish.png");
    loadSprite("sand-round", "media/platforms/sand/sand-round.png");
    loadSprite("sand-sharp-l", "media/platforms/sand/sand-sharp-r.png");
    loadSprite("sand-sharp-r", "media/platforms/sand/sand-sharp-l.png");
    loadSprite("sand-sharp", "media/platforms/sand/sand-sharp.png");
    loadSprite("background", "media/backgrounds/sea-bg.png");

    // Set Background //
    add([sprite("background"), pos(-1000, -1000), z(-10)]);
    // Set Package Counter //
    packageCounter.value = 3;
    packageCounter.text = `Remaining Packages: ${packageCounter.value}`;

    // Add Platforms //
    let genArr = [];
    // Add 7 Levels
    for (let i = 0; i < numLevels; i++) {
      let str = "";
      let lastValue = "";

      // Prodecurally generate random tiles //
      for (let j = 0; j < levelWidth; j++) {
        if (lastValue == "l" || lastValue == "m") {
          str += ["m", "r", "r"][randi(3)];
        } else if (lastValue == "r" || lastValue == "s") {
          str += " ";
        } else {
          str += ["l", " ", "s", " ", "l"][randi(5)];
        }
        lastValue = str[str.length - 1];
      }
      genArr.push(str);
    }
    let postOfficeSelection = randi(genArr[0].length);
    while (genArr[genArr.length - 1][postOfficeSelection] == " ") {
      postOfficeSelection = randi(genArr[0].length);
    }
    genArr[genArr.length - 1] =
      genArr[genArr.length - 1].slice(0, postOfficeSelection) +
      genArr[genArr.length - 1][postOfficeSelection].toUpperCase() +
      genArr[genArr.length - 1].slice(postOfficeSelection + 1);
    generatePlatforms(genArr, "sand");

    // Prodcedurally Generate Packages, Obstacles, and Enemies //
    let obstacleArr = [[], [], [], [], [], [], []];
    obstacleArr[0][0] = "p";

    let packagesNeeded = packageCounter.value;
    let obstaclesNeeded = 8;
    let enemiesNeeded = 15;

    while (packagesNeeded || obstaclesNeeded || enemiesNeeded) {
      let randomLevel = randi(numLevels);
      let randomPos = randi(levelWidth);
      if (
        genArr[randomLevel][randomPos] ===
        genArr[randomLevel][randomPos].toUpperCase()
      )
        continue;
      if (obstacleArr[randomLevel][randomPos]) continue;
      if (packagesNeeded) {
        add([
          sprite("envelope"),
          pos(randomPos * 199, randomLevel * 250 - 40),
          scale(1 / 10),
          area(),
          "collectable",
        ]);
        obstacleArr[randomLevel][randomPos] = "c";
        packagesNeeded--;
      } else if (obstaclesNeeded) {
        if (genArr[randomLevel][randomPos] == " ") continue;
        add([
          sprite("seaweed"),
          scale(1 / 10),
          pos(randomPos * 199, randomLevel * 250 - 90),
          area(),
          "obstacle",
          z(-1),
        ]);
        obstacleArr[randomLevel][randomPos] = "o";
        obstaclesNeeded--;
      } else if (enemiesNeeded) {
        if (genArr[randomLevel][randomPos] == " ") continue;
        add([
          sprite("pufferfish"),
          scale(1 / 8),
          pos(
            randomPos * 199 + randi(100),
            randomLevel * 250 - 64 - randi(120),
          ),
          area(),
          "obstacle",
        ]);
        obstacleArr[randomLevel][randomPos] = "e";
        enemiesNeeded--;
      }
    }
  });

  go("air");
  timer.isRunning = true;
});
