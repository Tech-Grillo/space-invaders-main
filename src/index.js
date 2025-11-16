import Grid from "./classes/Grid.js";
import Obstacle from "./classes/Obstacle.js";
import Particle from "./classes/Particle.js";
import Player from "./classes/Player.js";
import SoundEffects from "./classes/SoundEffects.js";
import Star from "./classes/Star.js";
import { GameState, NUMBER_STARS } from "./utils/constants.js";

const soundEffects = new SoundEffects();

const startScreen = document.querySelector(".start-screen");
const gameOverScreen = document.querySelector(".game-over");
const scoreUi = document.querySelector(".score-ui");
const scoreElement = scoreUi.querySelector(".score > span");
const levelElement = scoreUi.querySelector(".level > span");
const highElement = scoreUi.querySelector(".high > span");
const ammoElement = scoreUi.querySelector(".ammo > span") || createAmmoElement();
const buttonPlay = document.querySelector(".button-play");
const buttonRestart = document.querySelector(".button-restart");


function createAmmoElement() {
    const ammoSpan = document.createElement("span");
    ammoSpan.className = "ammo";
    ammoSpan.innerHTML = "ammo: <span>10</span>";
    scoreUi.querySelector("div").appendChild(ammoSpan);
    return ammoSpan.querySelector("span");
}

gameOverScreen.remove();

const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

canvas.width = innerWidth;
canvas.height = innerHeight;

ctx.imageSmoothingEnabled = false;

let currentState = GameState.START;

const gameData = {
    score: 0,
    level: 1,
    high: 0,
};

const showGameData = () => {
    scoreElement.textContent = gameData.score;
    levelElement.textContent = gameData.level;
    highElement.textContent = gameData.high;
    ammoElement.textContent = Math.ceil(playerAmmo.current);
};

const player = new Player(canvas.width, canvas.height);

// controle de munição que a nave atira
const playerAmmo = {
    max: 10,
    current: 10,
    rechargeTime: 3000, 
    rechargeRate: 1 / 180, // recarrega 1 tiro a cada seg 
    lastShotTime: 0,
    canShoot() {
        return this.current > 0;
    },
    shoot() {
        if (this.canShoot()) {
            this.current--;
            this.lastShotTime = Date.now();
            return true;
        }
        return false;
    },
    recharge(deltaTime) {
        // recarregar só após 0.5 seg de inatividade do jogadore
        const timeSinceLastShot = Date.now() - this.lastShotTime;
        if (timeSinceLastShot > 500 && this.current < this.max) {
            this.current = Math.min(this.max, this.current + this.rechargeRate);
        }
    }
};

const stars = [];
const playerProjectiles = [];
const invadersProjectiles = [];
const particles = [];
const obstacles = [];

const initObstacles = () => {
    const x = canvas.width / 2 - 50;
    const y = canvas.height - 250;
    const offset = canvas.width * 0.15;
    // cor fixa (restaurada)
    const color = "crimson";

    const obstacle1 = new Obstacle({ x: x - offset, y }, 100, 20, color);
    const obstacle2 = new Obstacle({ x: x + offset, y }, 100, 20, color);

    obstacles.push(obstacle1);
    obstacles.push(obstacle2);
};

initObstacles();


const grid = new Grid(
    Math.floor(Math.random() * 4) + 2,
    Math.floor(Math.random() * 4) + 2
);

const keys = {
    left: false,
    right: false,
    shoot: {
        pressed: false,
        released: true,
    },
};

const incrementScore = (value) => {
    gameData.score += value;

    if (gameData.score > gameData.high) {
        gameData.high = gameData.score;
    }
};

const incrementLevel = () => {
    gameData.level += 1;

    
};

const generateStars = () => {
    for (let i = 0; i < NUMBER_STARS; i += 1) {
        stars.push(new Star(canvas.width, canvas.height));
    }
};

const drawStars = () => {
    stars.forEach((star) => {
        star.draw(ctx);
        star.update();
    });
};

const drawProjectiles = () => {
    const projectiles = [...playerProjectiles, ...invadersProjectiles];

    projectiles.forEach((projectile) => {
        projectile.draw(ctx);
        projectile.update();
    });
};

const drawParticles = () => {
    particles.forEach((particle) => {
        particle.draw(ctx);
        particle.update();
    });
};

const drawObstacles = () => {
    obstacles.forEach((obstacle) => obstacle.draw(ctx));
};

const clearProjectiles = () => {
    playerProjectiles.forEach((projectile, i) => {
        if (projectile.position.y <= 0) {
            playerProjectiles.splice(i, 1);
        }
    });

    invadersProjectiles.forEach((projectile, i) => {
        if (projectile.position.y > canvas.height) {
            invadersProjectiles.splice(i, 1);
        }
    });
};

const clearParticles = () => {
    particles.forEach((particle, i) => {
        if (particle.opacity <= 0) {
            particles.splice(i, 1);
        }
    });
};

const createExplosion = (position, size, color) => {
    for (let i = 0; i < size; i += 1) {
        const particle = new Particle(
            {
                x: position.x,
                y: position.y,
            },
            {
                x: (Math.random() - 0.5) * 1.5,
                y: (Math.random() - 0.5) * 1.5,
            },
            2,
            color
        );

        particles.push(particle);
    }
};

const checkShootInvaders = () => {
    grid.invaders.forEach((invader, invaderIndex) => {
        playerProjectiles.some((projectile, projectileIndex) => {
            if (invader.hit(projectile)) {
                soundEffects.playHitSound();

                createExplosion(
                    {
                        x: invader.position.x + invader.width / 2,
                        y: invader.position.y + invader.height / 2,
                    },
                    10,
                    "#941CFF"
                );

                incrementScore(10);

                grid.invaders.splice(invaderIndex, 1);
                playerProjectiles.splice(projectileIndex, 1);

                return;
            }
        });
    });
};

const showGameOverScreen = () => {
    document.body.append(gameOverScreen);
    gameOverScreen.classList.add("zoom-animation");
};

const gameOver = () => {
    createExplosion(
        {
            x: player.position.x + player.width / 2,
            y: player.position.y + player.height / 2,
        },
        10,
        "white"
    );

    createExplosion(
        {
            x: player.position.x + player.width / 2,
            y: player.position.y + player.height / 2,
        },
        5,
        "#4D9BE6"
    );

    createExplosion(
        {
            x: player.position.x + player.width / 2,
            y: player.position.y + player.height / 2,
        },
        5,
        "crimson"
    );

    player.alive = false;
    currentState = GameState.GAME_OVER;
    showGameOverScreen();
};

const checkShootPlayer = () => {
    invadersProjectiles.some((projectile, index) => {
        if (player.hit(projectile)) {
            soundEffects.playExplosionSound();
            invadersProjectiles.splice(index, 1);

            gameOver();
        }
    });
};

const checkShootObstacles = () => {
    obstacles.forEach((obstacle) => {
        playerProjectiles.some((projectile, index) => {
            if (obstacle.hit(projectile)) {
                playerProjectiles.splice(index, 1);
                return;
            }
        });

        invadersProjectiles.some((projectile, index) => {
            if (obstacle.hit(projectile)) {
                invadersProjectiles.splice(index, 1);
                return;
            }
        });
    });
};

const checkInvadersCollidedObstacles = () => {
    obstacles.forEach((obstacle, i) => {
        grid.invaders.some((invader) => {
            if (invader.collided(obstacle)) {
                obstacles.splice(i, 1);
            }
        });
    });
};

const checkPlayerCollidedInvaders = () => {
    grid.invaders.some((invader) => {
        if (
            invader.position.x >= player.position.x &&
            invader.position.x <= player.position.x + player.width &&
            invader.position.y >= player.position.y
        ) {
            gameOver();
        }
    });
};

const spawnGrid = () => {
    if (grid.invaders.length === 0) {
        soundEffects.playNextLevelSound();

        // primeiro incrementa o level para que a nova grade leve em conta o level atual
        incrementLevel();

        // base menor (2..5)
        const baseRows = Math.floor(Math.random() * 4) + 2; // 2..5
        const baseCols = Math.floor(Math.random() * 4) + 2; // 2..5


        const extra = Math.min(2, Math.floor(gameData.level * 0.2));

      
        grid.rows = Math.min(8, baseRows + extra);
        grid.cols = Math.min(8, baseCols + extra);

        grid.restart();


        if (obstacles.length === 0) {
            initObstacles();
        }
    }
};

const gameLoop = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawStars();

    if (currentState === GameState.PLAYING) {
        showGameData();
        spawnGrid();

        // fiz aqui para recarregar munição
        playerAmmo.recharge();

        drawProjectiles();
        drawParticles();
        drawObstacles();

        clearProjectiles();
        clearParticles();

        checkShootInvaders();
        checkShootPlayer();
        checkShootObstacles();
        checkInvadersCollidedObstacles();
        checkPlayerCollidedInvaders();

        grid.draw(ctx);
        grid.update(player.alive);

        ctx.save();

        ctx.translate(
            player.position.x + player.width / 2,
            player.position.y + player.height / 2
        );

        if (keys.shoot.pressed && keys.shoot.released) {

            if (playerAmmo.shoot()) {
                soundEffects.playShootSound();
                player.shoot(playerProjectiles);
                keys.shoot.released = false;
            }
        }

        if (keys.left && player.position.x >= 0) {
            player.moveLeft();
            ctx.rotate(-0.15);
        }

        if (keys.right && player.position.x <= canvas.width - player.width) {
            player.moveRight();
            ctx.rotate(0.15);
        }

        ctx.translate(
            -player.position.x - player.width / 2,
            -player.position.y - player.height / 2
        );

        player.draw(ctx);
        ctx.restore();
    }

    if (currentState === GameState.GAME_OVER) {
        checkShootObstacles();

        drawProjectiles();
        drawParticles();
        drawObstacles();

        clearProjectiles();
        clearParticles();

        grid.draw(ctx);
        grid.update(player.alive);
    }

    requestAnimationFrame(gameLoop);
};

const restartGame = () => {
    currentState = GameState.PLAYING;

    player.alive = true;

    grid.invaders.length = 0;
    grid.invadersVelocity = 1;

    invadersProjectiles.length = 0;
    playerProjectiles.length = 0;
    particles.length = 0;
    obstacles.length = 0;

    gameData.score = 0;
    gameData.level = 1;

    // resetar munição
    playerAmmo.current = playerAmmo.max;
    playerAmmo.lastShotTime = Date.now();

    
    player.position.x = canvas.width / 2 - player.width / 2;
    player.position.y = canvas.height - player.height - 30;
    player.alive = true;

   
    grid.rows = Math.floor(Math.random() * 4) + 2;
    grid.cols = Math.floor(Math.random() * 4) + 2;
    grid.restart();
    initObstacles();

    showGameData();

    if (gameOverScreen.parentElement) {
        gameOverScreen.remove();
    }

    scoreUi.style.display = "block";
};

addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();

    if (key === "a") keys.left = true;
    if (key === "d") keys.right = true;
    if (key === " ") keys.shoot.pressed = true;
});

addEventListener("keyup", (event) => {
    const key = event.key.toLowerCase();

    if (key === "a") keys.left = false;
    if (key === "d") keys.right = false;
    if (key === " ") {
        keys.shoot.pressed = false;
        keys.shoot.released = true;
    }
});

buttonPlay.addEventListener("click", () => {
    startScreen.remove();
    scoreUi.style.display = "block";
    currentState = GameState.PLAYING;

    setInterval(() => {
        const invader = grid.getRandomInvader();

        if (invader) {
            invader.shoot(invadersProjectiles);
        }
    }, 1000);
});

buttonRestart.addEventListener("click", restartGame);

generateStars();
gameLoop();