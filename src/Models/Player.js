import {
    canvas,
    endRound,
    fences,
    fuels,
    heals,
    tanks,
    updateFrame,
    pressed_down_keys,
    activeTank,
} from "../game.js";

export class Player {
    constructor(color, isBot = false) {
        this.color = color;
        this.isBot = isBot;
        this.tanks = [];
        this.tankIndex = -1;
    }

    addTank(tank) {
        this.tanks.push(tank);
    }

    nextTank() {
        this.tankIndex++;
        if (this.tankIndex >= this.tanks.length) {
            this.tankIndex = 0;
        }
        while (this.tanks[this.tankIndex].isCrashed) {
            this.tankIndex++;
            if (this.tankIndex >= this.tanks.length) {
                this.tankIndex = 0;
            }
        }
        return this.tanks[this.tankIndex];
    }

    isLose() {
        let lose = true;
        for (let i = 0; i < this.tanks.length; i++) {
            if (!this.tanks[i].isCrashed) {
                lose = false;
                break;
            }
        }
        return lose;
    }

    calculateOptions(callback) {
        setTimeout(() => {
            callback();
        }, 1000);
    };

    turn() {
        return new Promise((resolve, reject) => {
            if (this.isBot) {
                console.log('Bot turn');
                setTimeout(() => {
                    console.log('Bot turn end');
                    endRound();
                    resolve();
                }, 3000);
            } else {
                console.log('Player turn');

                let moveAndAimInterval = setInterval(this.aimAndMove, 1000 / 50);
                // window.addEventListener('keypress', rotationAndShootControl);
            }
        });
    }

    aimAndMove() {
        let isUpdated = false;
        if (pressed_down_keys['w']) {
            activeTank.move('up', fences, tanks, heals, fuels, canvas);
            isUpdated = true;
        }
        if (pressed_down_keys['s']) {
            activeTank.move('down', fences, tanks, heals, fuels, canvas);
            isUpdated = true;
        }
        if (pressed_down_keys['a']) {
            activeTank.move('left', fences, tanks, heals, fuels, canvas);
            isUpdated = true;
        }
        if (pressed_down_keys['d']) {
            activeTank.move('right', fences, tanks, heals, fuels, canvas);
            isUpdated = true;
        }
        if (pressed_down_keys['ArrowUp']) {
            activeTank.addToAimParams(1, 0);
            isUpdated = true;
        }
        if (pressed_down_keys['ArrowDown']) {
            activeTank.addToAimParams(-1, 0);
            isUpdated = true;
        }
        if (pressed_down_keys['ArrowLeft']) {
            activeTank.addToAimParams(0, -1);
            isUpdated = true;
        }
        if (pressed_down_keys['ArrowRight']) {
            activeTank.addToAimParams(0, 1);
            isUpdated = true;
        }
        if (isUpdated) {
            updateFrame();
        }
    }


}