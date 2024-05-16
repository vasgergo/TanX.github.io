import {
    updateFrame,
    startNextRound,
    pressed_down_keys,
    activeTank,
    sounds,
    timerO, heals, canvas, fences, tanks, objectAt, fuels,
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

        for (let i = 0; i < fuels.length; i++) {
            if (activeTank.fuel !== activeTank.maxFuel) {
                utility += 10 / Math.pow(Player.getDistance(x, y, fuels[i].getCenter().x, fuels[i].getCenter().y), 1);
            }
        }

        tanks.filter(tank => tank !== activeTank).forEach(tank => {
            let distance = Player.getDistance(x, y, tank.getCenter().x, tank.getCenter().y);
            let radius = Tank.getRadiusToNotOverlap(activeTank, tank);
            if (distance < radius) {
                utility = -9;
            }
        });


        fences.forEach(fence => {

            //cirlce around the fence
            let distance = Player.getDistance(x, y, fence.getCenter().x, fence.getCenter().y);
            let radius = 100;
            if (distance < radius) {
                utility = -9;
            }
        });
        // console.log(utility);
        if (x < activeTank.width/2 || x + activeTank.width/2 > canvas.width || y < activeTank.height/2 || y + activeTank.height/2 > canvas.height) {
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

            function getPossibleShootAngles() {
                let result = new Set;
                tanks.forEach(tank => {
                    if (tank !== activeTank && !tank.isCrashed && tank.team !== activeTank.team) {
                        //result can be 0, 90, 180, 270
                        let angle = Math.atan2(tank.getCenter().y - activeTank.getCenter().y, tank.getCenter().x - activeTank.getCenter().x) * 180 / Math.PI;

                        angle += 90;
                        if (angle < 0) {
                            angle += 360;
                        }
                        if (angle > 315 || angle < 45) {
                            angle = 0;
                        }
                        if (angle > 45 && angle < 135) {
                            angle = 90;
                        }
                        if (angle > 135 && angle < 225) {
                            angle = 180;
                        }
                        if (angle > 225 && angle < 315) {
                            angle = 270;
                        }
                        result.add(angle);
                    }
                });
                return result;
            }


            function shoot() {
                const botLevel = 1;
                let random = Math.random();
                if (random > botLevel) {
                    Player.endRound();
                    activeTank.shoot().then(() => {
                        startNextRound();
                    });
                    return;
                }
                console.log('no random shoot');

                let tries = 0;
                let originalAngle = activeTank.angle;
                let originalP1 = activeTank.aimParams.p1;
                let originalP2 = activeTank.aimParams.p2;
                for (let l = 0; l < 271; l += 90) {
                    activeTank.angle = l;
                    activeTank.updateAimParams();
                    for (let i = Tank.paramInterval.p1.min; i < Tank.paramInterval.p1.max; i++) {
                        for (let j = Tank.paramInterval.p2.min; j < Tank.paramInterval.p2.max; j++) {
                            for (let k = 0; k < 2; k++) {
                                tries++;
                                activeTank.changeReflection();
                                activeTank.aimParams.p1 = i;
                                activeTank.aimParams.p2 = j;
                                let result = activeTank.shootResult();
                                if (result instanceof Tank && result.team !== activeTank.team && !result.isCrashed) {
                                    console.log('Shoot found');
                                    activeTank.angle = originalAngle;
                                    activeTank.isAiming = false;
                                    activeTank.rotationAnimation(l, () => {
                                        activeTank.angle = l;
                                        // activeTank.isAiming = true;
                                        updateFrame();
                                        let destP1 = activeTank.aimParams.p1;
                                        let destP2 = activeTank.aimParams.p2;
                                        activeTank.aimParams.p1 = originalP1;
                                        activeTank.aimParams.p2 = originalP2;
                                        aimingAnimation(destP1, destP2).then(() => {
                                            Player.endRound();
                                            activeTank.shoot().then(() => {
                                                startNextRound();
                                            });
                                        });

                                    });
                                    console.log('TRIES', tries);
                                    return;
                                }
                            }
                        }
                    }
                }
                console.log('Loop counter', tries);
                console.log('Shoot not found');
                Player.endRound();
                startNextRound();

            }

            function aimingAnimation(destP1, destP2) {
                activeTank.isAiming = true;
                return new Promise((resolve, reject) => {
                    let aimingInterval = setInterval(() => {
                        if (activeTank.aimParams.p1 < destP1) {
                            activeTank.addToAimParams(1, 0);
                        } else if (activeTank.aimParams.p1 > destP1) {
                            activeTank.addToAimParams(-1, 0);
                        }
                        if (activeTank.aimParams.p2 < destP2) {
                            activeTank.addToAimParams(0, 1);
                        } else if (activeTank.aimParams.p2 > destP2) {
                            activeTank.addToAimParams(0, -1);
                        }
                        updateFrame();
                        if (activeTank.aimParams.p1 === destP1 && activeTank.aimParams.p2 === destP2) {
                            clearInterval(aimingInterval);
                            activeTank.isAiming = false;
                            resolve();
                        }
                    }, 50);
                });
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