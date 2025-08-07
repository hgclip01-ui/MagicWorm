// Worm Game - Enhanced Mobile Version

class StartMenu extends Phaser.Scene {
    constructor() {
        super('StartMenu');
    }

    preload() {
        this.load.image('startBtn', 'assets/start-button.png');
    }

    create() {
        this.add.text(this.scale.width / 2, 100, 'Worm Game', {
            fontSize: '48px',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.add.image(this.scale.width / 2, this.scale.height / 2, 'startBtn')
            .setInteractive()
            .on('pointerdown', () => this.scene.start('GameScene'));
    }
}

class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    preload() {
        this.load.image('worm-head', 'assets/worm-head.png');
        this.load.image('worm-body', 'assets/worm-body.png');
        this.load.image('food', 'assets/food.png');
    }

    create() {
        this.direction = 'RIGHT';
        this.nextMove = 0;
        this.moveInterval = 150;

        this.snake = [];
        this.snake.push(this.createSegment(100, 100, 'worm-head', true));
        this.snake.push(this.createSegment(80, 100));
        this.snake.push(this.createSegment(60, 100));

        this.food = this.physics.add.image(200, 200, 'food').setOrigin(0);

        this.input.on('pointerdown', this.handleTouch, this);

        // Batas layar sebagai frame mati
        this.physics.world.setBounds(0, 0, this.sys.game.config.width, this.sys.game.config.height);

        // Collision dengan makanan
        this.physics.add.overlap(this.snake[0], this.food, this.eatFood, null, this);
    }

    createSegment(x, y, key = 'worm-body', isHead = false) {
        const segment = this.physics.add.image(x, y, key).setOrigin(0);
        segment.setImmovable(true);

        if (isHead) {
            segment.setSize(100, 64);
            segment.setOffset(0, 0);
        }

        return segment;
    }

    handleTouch(pointer) {
        const { x, y } = pointer;
        const head = this.snake[0];

        if (Math.abs(x - head.x) > Math.abs(y - head.y)) {
            this.direction = x > head.x ? 'RIGHT' : 'LEFT';
        } else {
            this.direction = y > head.y ? 'DOWN' : 'UP';
        }
    }

    update(time) {
        if (time >= this.nextMove) {
            this.moveSnake();
            this.nextMove = time + this.moveInterval;
        }

        // Cek tabrak frame (dinding)
        const head = this.snake[0];
        if (
            head.x < 0 || head.x >= this.sys.game.config.width ||
            head.y < 0 || head.y >= this.sys.game.config.height
        ) {
            this.scene.start('GameOver');
        }

        // Cek tabrak badan sendiri
        for (let i = 1; i < this.snake.length; i++) {
            if (
                Phaser.Math.Distance.Between(head.x, head.y, this.snake[i].x, this.snake[i].y) < 20
            ) {
                this.scene.start('GameOver');
            }
        }
    }

    moveSnake() {
        const head = this.snake[0];
        let newX = head.x;
        let newY = head.y;

        if (this.direction === 'LEFT') newX -= 20;
        else if (this.direction === 'RIGHT') newX += 20;
        else if (this.direction === 'UP') newY -= 20;
        else if (this.direction === 'DOWN') newY += 20;

        const tail = this.snake.pop();
        tail.x = newX;
        tail.y = newY;
        this.snake.unshift(tail);

        // Putar kepala sesuai arah
        if (this.direction === 'LEFT') head.angle = 180;
        else if (this.direction === 'RIGHT') head.angle = 0;
        else if (this.direction === 'UP') head.angle = -90;
        else if (this.direction === 'DOWN') head.angle = 90;

        // Putar body mengikuti kepala
        for (let i = 1; i < this.snake.length; i++) {
            this.snake[i].angle = this.snake[i - 1].angle;
        }
    }

    eatFood() {
        const last = this.snake[this.snake.length - 1];
        const newSegment = this.createSegment(last.x, last.y);
        newSegment.angle = last.angle;
        this.snake.push(newSegment);

        const randX = Phaser.Math.Between(0, this.sys.game.config.width - 20);
        const randY = Phaser.Math.Between(0, this.sys.game.config.height - 20);
        this.food.setPosition(randX, randY);
    }
}

class GameOver extends Phaser.Scene {
    constructor() {
        super('GameOver');
    }

    preload() {
        this.load.image('restartBtn', 'assets/restart-button.png');
    }

    create() {
        this.add.text(this.scale.width / 2, 100, 'Game Over', {
            fontSize: '48px',
            color: '#ff0000'
        }).setOrigin(0.5);

        this.add.image(this.scale.width / 2, this.scale.height / 2, 'restartBtn')
            .setInteractive()
            .on('pointerdown', () => this.scene.start('StartMenu'));
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#1d1d1d',
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    },
    scene: [StartMenu, GameScene, GameOver]
};

const game = new Phaser.Game(config);
