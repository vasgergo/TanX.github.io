import {
    updateFrame,
    startNextRound,
    pressed_down_keys,
    activeTank,
    sounds,
    timerO, heals, canvas, fences, tanks, objectAt,
} from "../game.js";
import {Rectagle} from "./Rectagle.js";
import {Tank} from "./Tank.js";

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
            if (activeTank.health !== activeTank.maxHealth) {
                utility += 10 / Math.pow(Player.getDistance(x, y, heals[i].getCenter().x, heals[i].getCenter().y), 1);
            }
        }

        tanks.filter(tank => tank !== activeTank).forEach(tank => {
            let distance = Player.getDistance(x, y, tank.getCenter().x, tank.getCenter().y);
            if (distance === 0) {
                distance = 0.00001;
            }
            utility -= 500 / Math.pow(distance, 2);
        });

        // fences.forEach(fence => {
        //     let distance = Player.getDistance(x, y, fence.getCenter().x, fence.getCenter().y);
        //     if (distance === 0) {
        //         distance = 0.00001;
        //     }
        //     utility -= 700 / Math.pow(distance, 2);
        // });

        fences.forEach(fence => {
            // if (fence.isOverlap({
            //     x: x,
            //     y: y,
            //     width: activeTank.width,
            //     height: activeTank.height
            // })) {
            //     utility = -9;
            // }
            //cirlce around the fence
            let distance = Player.getDistance(x, y, fence.getCenter().x, fence.getCenter().y);
            let radius = 120;
            if (distance < radius) {
                utility = -9;
            }
        });
        // console.log(utility);
        if (x < 60 || x + 60 > canvas.width || y < 60 || y + 60 > canvas.height) {
            utility = -9;
        }
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
                    let currunetUtility = Player.getUtility(activeTank.getCenter().x, activeTank.getCenter().y);
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
                    if (bestNeighbour !== null && maxUtility > currunetUtility + 0.0001 && activeTank.fuel > 10) {
                        console.log('Better move', bestNeighbour);
                        activeTank.move(bestNeighbour);
                    } else {
                        console.log('No better move');
                        clearInterval(interval);
                        shoot();
                    }
                }, 1000 / 50);
            } else {
                console.log('Player turn');
                Player.addControls();
            }

            function shoot() {
                const botLevel = 1;
                let random = Math.random();
                console.log('Random', random);
                if (random > botLevel) {
                    Player.endRound();
                    activeTank.shoot().then(() => {
                        startNextRound();
                    });
                    return;
                }
                console.log('no random shoot');
                let loopCounter = 0;
                // Player.endRound();
                let originalAngle = activeTank.angle;
                for (let l = 0; l < 271; l += 90) {
                    activeTank.angle = l;
                    activeTank.updateAimParams();
                    for (let i = Tank.paramInterval.p1.min; i < Tank.paramInterval.p1.max; i++) {
                        for (let j = Tank.paramInterval.p2.min; j < Tank.paramInterval.p2.max; j++) {
                            for (let k = 0; k < 1; k++) {
                                loopCounter++;
                                activeTank.changeReflection();
                                activeTank.aimParams.p1 = i;
                                activeTank.aimParams.p2 = j;
                                let result = activeTank.shootResult();
                                if (result instanceof Tank && result.team !== activeTank.team && !result.isCrashed) {
                                    console.log('Shoot to tank');
                                    activeTank.angle = originalAngle;
                                    activeTank.isAiming = false;
                                    activeTank.rotationAnimation(l, () => {
                                        activeTank.angle = l;
                                        Player.endRound();
                                        activeTank.shoot().then(() => {
                                            startNextRound();
                                        });
                                    });
                                    console.log('Loop counter', loopCounter);
                                    return;
                                }
                            }
                        }
                    }
                }
                console.log('Loop counter', loopCounter);
                console.log('Shoot not found');
                Player.endRound();
                startNextRound();
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
        return;
        if (!activeTank) {
            return;
        }
        let ctx = canvas.getContext('2d');
        let width = canvas.width;
        let height = canvas.height;
        let cellSize = 30;
        let heatmap = [];
        for (let i = 0; i < width; i += cellSize) {
            for (let j = 0; j < height; j += cellSize) {
                let utility = Player.getUtility(getCenter(i, j).x, getCenter(i, j).y, activeTank);
                heatmap.push({x: i, y: j, utility: utility});
            }
        }
        // console.log(heatmap);
        // normalize(heatmap);

        for (let i = 0; i < heatmap.length; i++) {
            ctx.fillStyle = `rgba(255, 0, 0, ${heatmap[i].utility}`;
            ctx.fillRect(heatmap[i].x, heatmap[i].y, cellSize, cellSize);
            //write utility on
            ctx.fillStyle = 'black';
            ctx.font = '12px Arial';
            ctx.fillText(heatmap[i].utility.toFixed(2), heatmap[i].x + 2, heatmap[i].y + 10);
        }

        function getCenter(x, y) {
            return {x: x + cellSize / 2, y: y + cellSize / 2};
        }

        //normilize utility
        function normalize(heatmap) {
            let max = 0;
            let min = 0;
            for (let i = 0; i < heatmap.length; i++) {
                if (heatmap[i].utility > max) {
                    max = heatmap[i].utility;
                }
                if (heatmap[i].utility < min) {
                    min = heatmap[i].utility;
                }
            }
            for (let i = 0; i < heatmap.length; i++) {
                heatmap[i].utility = (heatmap[i].utility - min) / (max - min);
            }
        }
    }


}