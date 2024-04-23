import {
    updateFrame,
    startNextRound,
    pressed_down_keys,
    activeTank,
    sounds,
    timerO, heals, canvas, fences, tanks,
} from "../game.js";
import {Rectagle} from "./Rectagle.js";

export class Player {
    constructor(color, isBot = false) {
        this.color = color;
        this.isBot = isBot;
        this.tanks = [];
        this.tankIndex = -1;
        this.activeTank = null;
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
        this.activeTank = this.tanks[this.tankIndex];
        return this.activeTank;
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
        callback();
    };

    static getUtility(x, y) {
        let utility = 0;
        for (let i = 0; i < heals.length; i++) {
            utility += 1000 / Math.pow(Player.getDistance(x, y, heals[i].getCenter().x, heals[i].getCenter().y), 2);
        }

        fences.forEach(fence => {
            if (fence.isOverlap({
                x: x + 5 - activeTank.width / 2,
                y: y + 5 - activeTank.height / 2,
                width: activeTank.width,
                height: activeTank.height
            })) {
                utility = 0;
            }
        });

        tanks.filter(tank => tank !== activeTank).forEach(tank => {
            // utility = utility * 0.0000001 * Math.pow(Player.getDistance(x, y, tank.getCenter().x, tank.getCenter().y),2);
        });
        // console.log(utility);
        return utility;
    }

    static getDistance(x1, y1, x2, y2) {
        return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
    }

    static timeUp() {
        Player.endRound();
        console.log('Time up');
        setTimeout(() => {
            Player.removeControls();
            startNextRound();
        }, 5000);

    }

    turn() {
        return new Promise((resolve, reject) => {
            activeTank.isAiming = true;
            updateFrame();

            timerO.addEventListener('OnTimeUp', Player.timeUp);

            if (this.isBot) {
                console.log('Bot turn');
                let counter = 0;
                let interval = setInterval(() => {
                    let neighbors = activeTank.getNeighbours();
                    let maxUtility = 0;
                    let bestNeighbour = null;
                    for (let direction in neighbors) {
                        let utility = Player.getUtility(neighbors[direction].x, neighbors[direction].y, this.activeTank);
                        if (utility > maxUtility) {
                            maxUtility = utility;
                            bestNeighbour = direction;
                        }
                    }
                    activeTank.move(bestNeighbour);
                }, 1);
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
        if (pressed_down_keys['w']) {
            activeTank.move('up');
        }
        if (pressed_down_keys['s']) {
            activeTank.move('down');
        }
        if (pressed_down_keys['a']) {
            activeTank.move('left');
        }
        if (pressed_down_keys['d']) {
            activeTank.move('right');
        }
        if (pressed_down_keys['ArrowUp']) {
            activeTank.addToAimParams(1, 0);
        }
        if (pressed_down_keys['ArrowDown']) {
            activeTank.addToAimParams(-1, 0);
        }
        if (pressed_down_keys['ArrowLeft']) {
            activeTank.addToAimParams(0, -1);
        }
        if (pressed_down_keys['ArrowRight']) {
            activeTank.addToAimParams(0, 1);
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
                Player.endRound();
                activeTank.shoot().then(() => {
                    startNextRound();
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

    static drawUtilityHeatMap() {
        if (!activeTank) {
            return;
        }
        let ctx = canvas.getContext('2d');
        let width = canvas.width;
        let height = canvas.height;
        let cellSize = 10;
        let heatmap = [];
        for (let i = 0; i < width; i += cellSize) {
            for (let j = 0; j < height; j += cellSize) {
                let utility = Player.getUtility(getCenter(i, j).x, getCenter(i, j).y, activeTank);
                heatmap.push({x: i, y: j, utility: utility});
            }
        }
        for (let i = 0; i < heatmap.length; i++) {
            ctx.fillStyle = `rgba(255, 0, 0, ${heatmap[i].utility}`;
            ctx.fillRect(heatmap[i].x, heatmap[i].y, cellSize, cellSize);
        }

        function getCenter(x, y) {
            return {x: x + cellSize / 2, y: y + cellSize / 2};
        }
    }


}