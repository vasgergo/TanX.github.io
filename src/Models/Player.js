import {
    updateFrame,
    startNextRound,
    pressed_down_keys,
    activeTank,
    sounds,
    timerO,
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

    static timeUp() {
        Player.endRound();
        console.log('Time up');
        setTimeout(() => {
            startNextRound();
        },3000);

    }

    turn() {
        return new Promise((resolve, reject) => {
            activeTank.isAiming = true;
            updateFrame();

            timerO.addEventListener('OnTimeUp', Player.timeUp);

            if (this.isBot) {
                console.log('Bot turn');
                setTimeout(() => {
                    timerO.stop();
                    activeTank.isAiming = false;
                    activeTank.shoot().then(() => {
                        resolve();
                    });
                }, 3000);
            } else {
                console.log('Player turn');
                Player.addControls();
            }
        });
    }

    static endRound() {
        timerO.stop();
        timerO.removeEventListener('OnTimeUp', Player.timeUp);
        activeTank.isAiming = false;
        updateFrame();
        Player.removeControls();
    }

    static moveAndAimInterval;

    static addControls() {
        Player.moveAndAimInterval = setInterval(Player.aimAndMoveControl, 1000 / 50);
        window.addEventListener('keypress', Player.rotationAndShootControl);
    }

    static removeControls() {
        clearInterval(Player.moveAndAimInterval);
        window.removeEventListener('keypress', Player.rotationAndShootControl);
    }

    static aimAndMoveControl() {
        let isUpdated = false;
        if (pressed_down_keys['w']) {
            activeTank.move('up');
            isUpdated = true;
        }
        if (pressed_down_keys['s']) {
            activeTank.move('down');
            isUpdated = true;
        }
        if (pressed_down_keys['a']) {
            activeTank.move('left');
            isUpdated = true;
        }
        if (pressed_down_keys['d']) {
            activeTank.move('right');
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

    static rotationAndShootControl(e) {
        if (e.key === '8' || e.key === '6' || e.key === '2' || e.key === '4') {
            activeTank.isAiming = false;
            Player.removeControls();
        }
        switch (e.key) {
            case '8':
                activeTank.rotationAnimation(0, callback);
                break;
            case '6':
                activeTank.rotationAnimation(90, callback);
                break;
            case '2':
                activeTank.rotationAnimation(180, callback);
                break;
            case '4':
                activeTank.rotationAnimation(270, callback);
                break;
            case"5":
                activeTank.changeReflection();
                updateFrame();
                break;
            case 'Enter':
                sounds['tank_fire'].play().then(() => {
                    Player.endRound();
                    activeTank.shoot().then(() => {
                        startNextRound();
                    });
                });
                break;
        }
        function callback() {
            if (timerO.getTime() > 0) {
                activeTank.isAiming = true;
                updateFrame();
                Player.addControls();
            }
        }
    }


}