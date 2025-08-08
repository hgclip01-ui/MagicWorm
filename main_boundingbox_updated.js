class StartMenuScene extends Phaser.Scene {
    constructor() { super('StartMenu'); }
    preload() {
        this.load.image('startBg', 'assets/background.png');
        this.load.image('startBtn', 'assets/start-button.png');
    }
    create() {
        this.add.image(this.scale.width / 2, this.scale.height / 2, 'startBg')
            .setDisplaySize(this.scale.width, this.scale.height);

        this.add.text(this.scale.width / 2, this.scale.height / 2 - 100, 'WORM GAME',
            { fontSize: '48px', fill: '#fff' }).setOrigin(0.5);

        this.add.image(this.scale.width / 2, this.scale.height / 2 + 50, 'startBtn')
            .setInteractive()
            .on('pointerdown', () => this.scene.start('GameScene'));
    }
}

class GameScene extends Phaser.Scene {
    constructor() { super('GameScene'); }
    preload() {
        this.load.image('head', 'assets/worm-head.png');
        this.load.image('body', 'assets/worm-body.png');
        this.load.image('tail', 'assets/worm-body.png');
        this.load.image('food', 'assets/food.png');
        this.load.image('background', 'assets/background.png');
    }
    create() {
        this.add.image(this.scale.width / 2, this.scale.height / 2, 'background')
            .setDisplaySize(this.scale.width, this.scale.height);

        this.speed = 20;
        this.direction = 'RIGHT';
        this.nextDirection = 'RIGHT';
        this.moveTimer = 0;
        this.score = 0;
        this.alive = true;

        this.snake = [];
        this.snake.push(this.add.sprite(100, 100, 'head'));
        this.snake.push(this.add.sprite(60, 100, 'body'));
        this.snake.push(this.add.sprite(60, 100, 'tail'));

        this.food = this.add.sprite(200, 200, 'food');
        this.placeFood();

        this.scoreText = this.add.text(10, 10, 'Score: 0',
            { fontSize: '24px', fill: '#fff' });

        this.cursors = this.input.keyboard.createCursorKeys();

        this.input.on('pointerdown', (pointer) => {
            this.startX = pointer.x;
            this.startY = pointer.y;
        });
        this.input.on('pointerup', (pointer) => {
            let dx = pointer.x - this.startX;
            let dy = pointer.y - this.startY;
            if (Math.abs(dx) > Math.abs(dy)) {
                if (dx > 0 && this.direction !== 'LEFT') this.nextDirection = 'RIGHT';
                else if (dx < 0 && this.direction !== 'RIGHT') this.nextDirection = 'LEFT';
            } else {
                if (dy > 0 && this.direction !== 'UP') this.nextDirection = 'DOWN';
                else if (dy < 0 && this.direction !== 'DOWN') this.nextDirection = 'UP';
            }
        });
    }

    update(time) {
        if (!this.alive) return;

        if (this.cursors.left.isDown && this.direction !== 'RIGHT') this.nextDirection = 'LEFT';
        else if (this.cursors.right.isDown && this.direction !== 'LEFT') this.nextDirection = 'RIGHT';
        else if (this.cursors.up.isDown && this.direction !== 'DOWN') this.nextDirection = 'UP';
        else if (this.cursors.down.isDown && this.direction !== 'UP') this.nextDirection = 'DOWN';

        if (time > this.moveTimer) {
            this.moveTimer = time + 150;
            this.direction = this.nextDirection;
            this.moveSnake();
        }
    }

    
moveSnake() {
    let head = this.snake[0];
    let newX = head.x;
    let newY = head.y;

    if (this.direction === 'LEFT') newX -= this.speed;
    else if (this.direction === 'RIGHT') newX += this.speed;
    else if (this.direction === 'UP') newY -= this.speed;
    else if (this.direction === 'DOWN') newY += this.speed;

    // === [1] Collision dengan dinding pakai bounding box 100x64 ===
    if (
        newX - 50 < 0 ||                     // kiri
        newX + 50 > this.scale.width ||       // kanan
        newY - 32 < 0 ||                      // atas
        newY + 32 > this.scale.height         // bawah
    ) {
        this.gameOver();
        return;
    }

    // Move body
    for (let i = this.snake.length - 1; i > 0; i--) {
        this.snake[i].x = this.snake[i - 1].x;
        this.snake[i].y = this.snake[i - 1].y;
        this.snake[i].angle = this.snake[i - 1].angle;
    }

    head.x = newX;
    head.y = newY;

    // Rotate head
    if (this.direction === 'LEFT') head.angle = 180;
    else if (this.direction === 'RIGHT') head.angle = 0;
    else if (this.direction === 'UP') head.angle = -90;
    else if (this.direction === 'DOWN') head.angle = 90;

    for (let i = 1; i < this.snake.length; i++) {
        this.snake[i].angle = this.snake[i - 1].angle;
    }

    // === [2] Collision dengan badan sendiri pakai bounding box 100x64 ===
    for (let i = 1; i < this.snake.length; i++) {
        if (Phaser.Geom.Intersects.RectangleToRectangle(
            new Phaser.Geom.Rectangle(newX - 50, newY - 32, 100, 64),
            new Phaser.Geom.Rectangle(this.snake[i].x - 50, this.snake[i].y - 32, 100, 64)
        )) {
            this.gameOver();
            return;
        }
    }

    // === [3] Collision dengan food pakai bounding box kepala 100x64 vs food 32x32 ===
    if (Phaser.Geom.Intersects.RectangleToRectangle(
        new Phaser.Geom.Rectangle(newX - 50, newY - 32, 100, 64),
        new Phaser.Geom.Rectangle(this.food.x - 16, this.food.y - 16, 32, 32)
    )) {
        this.snake.push(this.add.sprite(
            this.snake[this.snake.length - 1].x,
            this.snake[this.snake.length - 1].y,
            'body'
        ));
        this.score += 10;
        this.scoreText.setText('Score: ' + this.score);
        this.placeFood();
    }
}


class GameOverScene extends Phaser.Scene {
    constructor() { super('GameOverScene'); }
    init(data) { this.finalScore = data.score; }
    preload() {
        this.load.image('bg', 'assets/background.png');
        this.load.image('restartBtn', 'assets/restart-button.png');
    }
    create() {
        this.add.image(this.scale.width / 2, this.scale.height / 2, 'bg')
            .setDisplaySize(this.scale.width, this.scale.height);

        this.add.text(this.scale.width / 2, this.scale.height / 2 - 100, 'GAME OVER',
            { fontSize: '48px', fill: '#f00' }).setOrigin(0.5);

        this.add.text(this.scale.width / 2, this.scale.height / 2, 'Score: ' + this.finalScore,
            { fontSize: '32px', fill: '#fff' }).setOrigin(0.5);

        this.add.image(this.scale.width / 2, this.scale.height / 2 + 100, 'restartBtn')
            .setInteractive()
            .on('pointerdown', () => this.scene.start('StartMenu'));
    }
}

const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#2d2d2d',
    parent: 'game-container',
    scene: [StartMenuScene, GameScene, GameOverScene]
};

const game = new Phaser.Game(config);

window.addEventListener('resize', () => {
    game.scale.resize(window.innerWidth, window.innerHeight);
});
