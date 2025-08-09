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

        // Input wallet HTML
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Masukkan Alamat Wallet Monad';
        input.id = 'wallet-input';
        input.style.position = 'absolute';
        input.style.left = `${window.innerWidth / 2 - 150}px`;
        input.style.top = `${window.innerHeight / 2}px`;
        input.style.width = '300px';
        input.style.padding = '10px';
        input.style.fontSize = '18px';
        input.style.border = '2px solid #0f0';
        input.style.borderRadius = '8px';
        input.style.background = 'rgba(0,0,0,0.6)';
        input.style.color = '#fff';
        input.style.textAlign = 'center';
        input.style.outline = 'none';
        document.body.appendChild(input);

        this.add.image(this.scale.width / 2, this.scale.height / 2 + 100, 'startBtn')
            .setInteractive()
            .on('pointerdown', () => {
                const walletAddress = input.value.trim();
                if (!walletAddress) {
                    alert("Masukkan alamat wallet terlebih dahulu!");
                    return;
                }
                input.remove();
                this.game.canvas.focus();
                this.scene.start('GameScene', { playerWallet: walletAddress });
            });
    }
}

class GameScene extends Phaser.Scene {
    constructor() { super('GameScene'); }
    init(data) { this.playerWallet = data.playerWallet; }
    preload() {
        this.load.image('head', 'assets/worm-head.png');
        this.load.image('body', 'assets/worm-body.png');
        this.load.image('tail', 'assets/worm-body.png');
        this.load.image('food', 'assets/food.png');
        this.load.image('background', 'assets/background.png');

        // Tombol panah untuk HP
        this.load.image('arrowUp', 'assets/arrow-up.png');
        this.load.image('arrowDown', 'assets/arrow-down.png');
        this.load.image('arrowLeft', 'assets/arrow-left.png');
        this.load.image('arrowRight', 'assets/arrow-right.png');
    }
    create() {
        this.add.image(this.scale.width / 2, this.scale.height / 2, 'background')
            .setDisplaySize(this.scale.width, this.scale.height);

        this.speed = 30;
        this.direction = 'RIGHT';
        this.nextDirection = 'RIGHT';
        this.moveDelay = 150;
        this.lastMoveTime = 0;
        this.score = 0;
        this.alive = true;

        // Spawn di tengah
        const startX = Math.floor(this.scale.width / (2 * this.speed)) * this.speed;
        const startY = Math.floor(this.scale.height / (2 * this.speed)) * this.speed;

        this.snake = [];
        this.snake.push(this.add.sprite(startX, startY, 'head'));
        this.snake.push(this.add.sprite(startX - this.speed, startY, 'body'));
        this.snake.push(this.add.sprite(startX - this.speed * 2, startY, 'tail'));

        this.food = this.add.sprite(200, 200, 'food');
        this.placeFood();

        this.scoreText = this.add.text(10, 10, 'Score: 0',
            { fontSize: '24px', fill: '#fff' });

        // Keyboard untuk PC
        this.cursors = this.input.keyboard.createCursorKeys();

        // Tombol panah untuk HP
        if (/Mobi|Android/i.test(navigator.userAgent)) {
            this.createMobileControls();
        }
    }
    createMobileControls() {
        const size = 60;
        const alpha = 0.5;

        const left = this.add.image(80, this.scale.height - 80, 'arrowLeft').setInteractive().setAlpha(alpha);
        const right = this.add.image(160, this.scale.height - 80, 'arrowRight').setInteractive().setAlpha(alpha);
        const up = this.add.image(this.scale.width - 120, this.scale.height - 140, 'arrowUp').setInteractive().setAlpha(alpha);
        const down = this.add.image(this.scale.width - 120, this.scale.height - 60, 'arrowDown').setInteractive().setAlpha(alpha);

        left.on('pointerdown', () => { if (this.direction !== 'RIGHT') this.nextDirection = 'LEFT'; });
        right.on('pointerdown', () => { if (this.direction !== 'LEFT') this.nextDirection = 'RIGHT'; });
        up.on('pointerdown', () => { if (this.direction !== 'DOWN') this.nextDirection = 'UP'; });
        down.on('pointerdown', () => { if (this.direction !== 'UP') this.nextDirection = 'DOWN'; });

        left.setDisplaySize(size, size);
        right.setDisplaySize(size, size);
        up.setDisplaySize(size, size);
        down.setDisplaySize(size, size);
    }
    update(time) {
        if (!this.alive) return;

        // Keyboard control
        if (this.cursors.left.isDown && this.direction !== 'RIGHT') this.nextDirection = 'LEFT';
        else if (this.cursors.right.isDown && this.direction !== 'LEFT') this.nextDirection = 'RIGHT';
        else if (this.cursors.up.isDown && this.direction !== 'DOWN') this.nextDirection = 'UP';
        else if (this.cursors.down.isDown && this.direction !== 'UP') this.nextDirection = 'DOWN';

        // Pindah ular
        if (time - this.lastMoveTime > this.moveDelay) {
            this.lastMoveTime = time;
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

        if (newX < 0 || newX >= this.scale.width || newY < 0 || newY >= this.scale.height) {
            return this.gameOver();
        }

        for (let i = this.snake.length - 1; i > 0; i--) {
            this.snake[i].x = this.snake[i - 1].x;
            this.snake[i].y = this.snake[i - 1].y;
        }
        head.x = newX;
        head.y = newY;

        for (let i = 1; i < this.snake.length; i++) {
            if (head.x === this.snake[i].x && head.y === this.snake[i].y) {
                return this.gameOver();
            }
        }

        if (Phaser.Math.Distance.Between(head.x, head.y, this.food.x, this.food.y) < 15) {
            this.snake.push(this.add.sprite(
                this.snake[this.snake.length - 1].x,
                this.snake[this.snake.length - 1].y,
                'body'
            ));
            this.score += 1;
            this.scoreText.setText('Score: ' + this.score);
            this.placeFood();

            if (this.score * 0.1 >= 5) {
                return this.gameOver();
            }
        }
    }
    placeFood() {
        this.food.x = Math.floor(Phaser.Math.Between(0, this.scale.width / this.speed - 1)) * this.speed;
        this.food.y = Math.floor(Phaser.Math.Between(0, this.scale.height / this.speed - 1)) * this.speed;
    }
    gameOver() {
        this.alive = false;
        this.scene.start('GameOverScene', { 
            score: this.score,
            wallet: this.playerWallet
        });
    }
}

class GameOverScene extends Phaser.Scene {
    constructor() { super('GameOverScene'); }
    init(data) { 
        this.finalScore = data.score; 
        this.playerWallet = data.wallet; 
    }
    preload() {
        this.load.image('bg', 'assets/background.png');
        this.load.image('restartBtn', 'assets/restart-button.png');
    }
    async create() {
        this.add.image(this.scale.width / 2, this.scale.height / 2, 'bg')
            .setDisplaySize(this.scale.width, this.scale.height);

        this.add.text(this.scale.width / 2, this.scale.height / 2 - 100, 'GAME OVER',
            { fontSize: '48px', fill: '#f00' }).setOrigin(0.5);

        this.add.text(this.scale.width / 2, this.scale.height / 2, 'Score: ' + this.finalScore,
            { fontSize: '32px', fill: '#fff' }).setOrigin(0.5);

        let statusText = this.add.text(this.scale.width / 2, this.scale.height / 2 + 50, "Mengirim reward...",
            { fontSize: '20px', fill: '#fff' }).setOrigin(0.5);

        try {
            const res = await fetch("https://reward-indol.vercel.app/api/claimReward", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    wallet: this.playerWallet,
                    score: this.finalScore
                })
            });

            const data = await res.json();
            if (res.ok) {
                statusText.setText(`Reward ${data.reward} MON terkirim!`);
            } else {
                statusText.setText(`Gagal: ${data.error}`);
            }
        } catch (err) {
            statusText.setText(`Error koneksi: ${err.message}`);
        }

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
