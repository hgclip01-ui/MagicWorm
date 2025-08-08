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

        this.speed = 30;
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

        this.scoreText = this.add.text(0.1, 0.1, 'Score: 0',
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

        if (newX < 0 || newX > this.scale.width || newY < 0 || newY > this.scale.height) {
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

        // Self collision
        for (let i = 1; i < this.snake.length; i++) {
            if (head.x === this.snake[i].x && head.y === this.snake[i].y) {
                this.gameOver();
                return;
            }
        }

        // Food collision
        if (Phaser.Math.Distance.Between(head.x, head.y, this.food.x, this.food.y) < 15) {
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

    placeFood() {
        this.food.x = Phaser.Math.Between(20, this.scale.width - 20);
        this.food.y = Phaser.Math.Between(20, this.scale.height - 20);
    }

    gameOver() {
        this.alive = false;
        this.scene.start('GameOverScene', { score: this.score });
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
