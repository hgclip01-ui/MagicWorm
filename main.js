// main.js
// Game Worm versi mobile + bounding box 100x64

let config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#000000',
    physics: {
        default: 'arcade',
        arcade: { debug: false }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

let game = new Phaser.Game(config);
let worm;
let food;
let cursors;
let score = 0;
let scoreText;
let speed = 100;
let direction = 'RIGHT';
let isGameOver = false;

function preload() {
    this.load.image('wormHead', 'assets/worm-head.png'); // 100x64
    this.load.image('wormBody', 'assets/worm-body.png');
    this.load.image('food', 'assets/food.png');
    this.load.image('startUI', 'assets/start-ui.png');
    this.load.image('restartUI', 'assets/restart-ui.png');
}

function create() {
    score = 0;
    isGameOver = false;

    // Worm head
    worm = this.physics.add.group();
    let head = worm.create(100, 100, 'wormHead');
    head.setOrigin(0.5);
    head.body.setSize(100, 64); // Bounding box akurat
    head.body.setOffset(0, 0);

    // Food
    food = this.physics.add.image(400, 300, 'food');

    // UI Score
    scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '24px', fill: '#FFF' });

    // Kontrol
    cursors = this.input.keyboard.createCursorKeys();

    // Collision dengan food
    this.physics.add.overlap(worm, food, eatFood, null, this);

    // Game over jika nabrak dinding
    this.physics.world.setBoundsCollision(true, true, true, true);
    worm.children.iterate(function (segment) {
        segment.setCollideWorldBounds(true);
        segment.body.onWorldBounds = true;
    });

    this.physics.world.on('worldbounds', function () {
        gameOver.call(this);
    }, this);
}

function update() {
    if (isGameOver) return;

    // Gerakan otomatis
    let head = worm.getChildren()[0];
    if (direction === 'LEFT') head.x -= speed * this.game.loop.delta / 1000;
    else if (direction === 'RIGHT') head.x += speed * this.game.loop.delta / 1000;
    else if (direction === 'UP') head.y -= speed * this.game.loop.delta / 1000;
    else if (direction === 'DOWN') head.y += speed * this.game.loop.delta / 1000;

    // Kontrol arah
    if (cursors.left.isDown && direction !== 'RIGHT') direction = 'LEFT';
    else if (cursors.right.isDown && direction !== 'LEFT') direction = 'RIGHT';
    else if (cursors.up.isDown && direction !== 'DOWN') direction = 'UP';
    else if (cursors.down.isDown && direction !== 'UP') direction = 'DOWN';

    // Cek tabrakan dengan badan sendiri
    let segments = worm.getChildren();
    for (let i = 1; i < segments.length; i++) {
        if (Phaser.Geom.Intersects.RectangleToRectangle(head.getBounds(), segments[i].getBounds())) {
            gameOver.call(this);
        }
    }
}

function eatFood(head, f) {
    score += 10;
    scoreText.setText('Score: ' + score);

    // Pindahkan makanan
    food.x = Phaser.Math.Between(50, 750);
    food.y = Phaser.Math.Between(50, 550);

    // Tambah badan
    let tail = worm.getChildren()[worm.getChildren().length - 1];
    let newSegment = worm.create(tail.x, tail.y, 'wormBody');
    newSegment.setOrigin(0.5);
    newSegment.body.setSize(100, 64);
}

function gameOver() {
    isGameOver = true;
    this.add.image(400, 300, 'restartUI').setOrigin(0.5);
    this.input.once('pointerdown', () => {
        this.scene.restart();
    });
}
