import {Tank} from "./Models/Tank.js";
import {Player} from "./Models/Player.js";
import {Fence} from "./Models/Fence.js";
import {Heal} from "./Models/Heal.js";
import {Fuel} from "./Models/Fuel.js";

const imagNames = ['desert', 'red_heavy', 'red_light', 'red_medium', 'blue_heavy', 'blue_light', 'blue_medium', 'fence', 'red_cross', 'fuel', 'heal'];

let CANVAS_WIDTH = 1100;
let CANVAS_HEIGHT = 650;
let WINDOW_WIDTH = window.innerWidth;
let WINDOW_HEIGHT = window.innerHeight;
let ctx;
let canvas;
let redPlayer;
let bluePlayer;
let players = [];
let testTank;
let images = [];
let isAimInProgress = false;
let allTanks = [];
let activePlayer;
let activeTank;
let allFences = [];
let seconds = 0;
const ROUND_TIME = 30;
const TIME_AFTER_COLLOSION = 1000;
let timer;
let allHeals = [];
let allFuels = [];
let allOverlappables = [];


window.onload = function () {
    loadImages();
}

function loadImages() {
    function loadPngByName(imageName) {
        return new Promise((resolve) => {
            let img = new Image();
            img.src = './pictures/' + imageName + '.png';
            img.onload = () => {
                images[imageName] = img
                resolve();
            }
        });
    }

    //load all images
    let promises = [];

    //for in pictures folder
    for (let i = 0; i < imagNames.length; i++) {
        promises.push(loadPngByName(imagNames[i]));
    }

    Promise.all(promises).then(() => {
        console.log('all images loaded');
        init()
    });
}

function init() {
    canvas = document.getElementById('myCanvas');
    ctx = canvas.getContext('2d');
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    //center the canvas
    canvas.style.left = ((WINDOW_WIDTH - CANVAS_WIDTH) / 2) - 5 + 'px';
    canvas.style.top = ((WINDOW_HEIGHT - CANVAS_HEIGHT) / 2) - 5 + 'px';

    Heal.image = images['heal'];
    Fuel.image = images['fuel'];
    Fence.image = images['fence'];

    Heal.ctx = ctx;
    Fuel.ctx = ctx;

    //create players
    redPlayer = new Player('red');
    bluePlayer = new Player('blue');
    players.push(bluePlayer);
    players.push(redPlayer);
    bluePlayer.addTank(new Tank(500, 150, 'blue', 'light', 'right', images['blue_light'], ctx));
    bluePlayer.addTank(new Tank(110, 300, 'blue', 'medium', 'right', images['blue_medium'], ctx));
    bluePlayer.addTank(new Tank(100, 450, 'blue', 'heavy', 'right', images['blue_heavy'], ctx));
    redPlayer.addTank(new Tank(930, 150, 'red', 'light', 'left', images['red_light'], ctx));
    redPlayer.addTank(new Tank(890, 310, 'red', 'medium', 'left', images['red_medium'], ctx));
    redPlayer.addTank(new Tank(950, 430, 'red', 'heavy', 'left', images['red_heavy'], ctx));

    players.forEach((player) => {
        player.tanks.forEach((tank) => {
            allTanks.push(tank);
        });
    });

    let randomInit = false;

    allOverlappables.push(allFences, allHeals, allFuels, allTanks);

    //----------PREDEFINED INITIALIZATION----------------

    if (!randomInit) {

        allFences.push(new Fence(350, 100, 'normal_y', 10));
        allFences.push(new Fence(350, 400, 'normal_y', 10));
        allFences.push(new Fence(700, 100, 'normal_y', 10));
        allFences.push(new Fence(700, 400, 'normal_y', 10));
        allFences.push(new Fence(480, 250, 'tank_trap', 10));

        allHeals.push(new Heal(180, 150));
        allHeals.push(new Heal(500, 450));
        allHeals.push(new Heal(900, 45));

        allFuels.push(new Fuel(700, 270));
        allFuels.push(new Fuel(500, 150));

        console.log(allOverlappables);
    }
    //-----------RANDOM INITIALIZATION----------------

    if (randomInit) {
        allOverlappables.push(allTanks);
        allFences = Fence.randomWalls(images['fence'], allOverlappables);
        allOverlappables.push(allFences);
        allHeals.push(Heal.randomHeal(allOverlappables));
        allFuels.push(Fuel.randomFuel(allOverlappables));




    }

    //it's needed to start with blue player
    activePlayer = redPlayer;

    startGame();
}

function startGame() {
    console.log('game started');
    updateFrame();
    nextRound();
}

function updateInfoPanels() {
    let actualTankColor;
    let actualTankType;
    for (let i = 0; i < allTanks.length; i++) {
        actualTankColor = allTanks[i].team;
        actualTankType = allTanks[i].type;
        document.getElementById(actualTankColor + '_' + actualTankType + '_' + 'health').innerText = allTanks[i].health;
        document.getElementById(actualTankColor + '_' + actualTankType + '_' + 'fuel').innerText = allTanks[i].fuel.toFixed(1);
        document.getElementById(actualTankColor + '_' + actualTankType + '_' + 'consumption').innerText = allTanks[i].consumption;
        document.getElementById(actualTankColor + '_' + actualTankType + '_' + 'damage').innerText = allTanks[i].damage;

    }
}

function nextRound() {
    seconds = ROUND_TIME;
    activePlayer = nextPlayer();
    activeTank = activePlayer.nextTank();
    console.log('->Active player is: ' + activePlayer.color + ' tank: ' + activeTank.type);
    updateInfoPanels();
    //set all tank class div background to red
    updateInfoPanelTankColor();
    document.getElementById(activeTank.team + '_' + activeTank.type).style.backgroundColor = 'green';
    if (activePlayer.color === 'blue') {
        document.getElementById('blueActiveTankImg').src = activeTank.img.src;
        document.getElementById('redActiveTankImg').src = images['red_cross'].src;
    } else {
        document.getElementById('redActiveTankImg').src = activeTank.img.src;
        document.getElementById('blueActiveTankImg').src = images['red_cross'].src;
    }

    // Rotiation control
    window.addEventListener('keypress', roationControl);

    // Move & aim control
    window.addEventListener('keydown', moveAimControl);


    timer = setInterval(() => {
        window.document.getElementById('timer').innerText = seconds.toFixed(1);
        if (seconds <= 0.1) {
            console.log('time is up');
            clearInterval(timer);
            endRound();
            setTimeout(() => {
                nextRound();
            }, 1000);
        }
        seconds -= 0.1;
    }, 100);
    activeTank.aimFunction = sinus;
    isAimInProgress = true;

    allHeals.push(Heal.randomHeal(allOverlappables));
    allFuels.push(Fuel.randomFuel(allOverlappables));

    updateFrame()
}

function updateInfoPanelTankColor() {
    let color;
    for (let i = 0; i < allTanks.length; i++) {
        if (allTanks[i] === activeTank) {
            color = 'green';
        } else if (allTanks[i].isCrashed) {
            color = 'red';
        } else {
            color = 'white';
        }
        document.getElementById(allTanks[i].team + '_' + allTanks[i].type).style.backgroundColor = color;
    }

}

function endRound() {
    clearInterval(timer);
    window.removeEventListener('keydown', moveAimControl);
    window.removeEventListener('keypress', roationControl);
}

function moveAimControl(e) {
    switch (e.key) {
        case 'w':
            activeTank.move('up', allFences, allTanks, allHeals, allFuels, canvas);
            break;
        case 's':
            activeTank.move('down', allFences, allTanks, allHeals, allFuels, canvas);
            break;
        case 'a':
            activeTank.move('left', allFences, allTanks, allHeals, allFuels, canvas);
            break;
        case 'd':
            activeTank.move('right', allFences, allTanks, allHeals, allFuels, canvas);
            break;
        case 'ArrowUp':
            activeTank.aimParams.p1 += 1;
            break;
        case 'ArrowDown':
            activeTank.aimParams.p1 -= 1;
            break;
        case 'ArrowLeft':
            activeTank.aimParams.p2 -= 1;
            break;
        case 'ArrowRight':
            activeTank.aimParams.p2 += 1;
            break;
        case 'Enter':
            endRound();
            shoot(activeTank);
            break;
    }
    updateFrame()
}

function roationControl(e) {
    if (e.key === '8' || e.key === '6' || e.key === '2' || e.key === '4') {
        isAimInProgress = false;
        window.removeEventListener('keypress', roationControl);
        window.removeEventListener('keydown', moveAimControl);
        console.log('key removed');
    }
    switch (e.key) {
        case '8':
            activeTank.rotationAnimation(0, updateFrame, callback);
            break;
        case '6':
            activeTank.rotationAnimation(90, updateFrame, callback);
            break;
        case '2':
            activeTank.rotationAnimation(180, updateFrame, callback);
            break;
        case '4':
            activeTank.rotationAnimation(270, updateFrame, callback);
            break;
    }

    function callback() {
        if (seconds !== ROUND_TIME) {
            isAimInProgress = true;
            updateFrame();
            window.addEventListener('keypress', roationControl);
            window.addEventListener('keydown', moveAimControl);
        }
    }
}

function shoot(tankParam) {
    console.log('shoot!');
    let angleMultiplierX2;
    let angleMultiplierY;
    let reverse;
    let x;
    let y;
    let func = tankParam.aimFunction;
    let param1 = tankParam.aimParams.p1;
    let param2 = tankParam.aimParams.p2;
    switch (tankParam.angle) {
        case 0:
            x = tankParam.x + tankParam.img.width / 2;
            y = tankParam.y;
            angleMultiplierX2 = -1;
            angleMultiplierY = 1;
            reverse = true;
            break;
        case 90:
            x = tankParam.x + tankParam.img.width;
            y = tankParam.y + tankParam.img.height / 2;
            angleMultiplierX2 = 1;
            angleMultiplierY = 1;
            reverse = false;
            break;
        case 180:
            x = tankParam.x + tankParam.img.width / 2;
            y = tankParam.y + tankParam.img.height;
            angleMultiplierX2 = 1;
            angleMultiplierY = 1;
            reverse = true;
            break;
        case 270:
            x = tankParam.x;
            y = tankParam.y + tankParam.img.height / 2;
            angleMultiplierX2 = -1;
            angleMultiplierY = -1;
            reverse = false;
            break;
    }
    let destX;
    let destY;
    let intervalCounter = 0;
    let collosionResult;
    let interval = setInterval(() => {
        ctx.drawImage(images['desert'], 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        allTanks.forEach((tank) => {
            tank.draw();
        });
        allFences.forEach((fence) => {
            fence.draw(ctx);
        });
        allFuels.forEach((fuel) => {
            fuel.draw();
        });
        allHeals.forEach((heal) => {
            heal.draw();
        });
        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.moveTo(x, y);
        for (let i = 0; i < intervalCounter; i++) {
            if (!reverse) {
                destX = x + angleMultiplierX2 * i;
                destY = y + angleMultiplierY * func(i, param1, param2);
            } else {
                destX = x + angleMultiplierY * func(i, param1, param2);
                destY = y + angleMultiplierX2 * i
            }
            collosionResult = collosion(destX, destY);
            if (collosionResult.bool) {
                ctx.lineTo(destX, destY);
                ctx.stroke();
                ctx.closePath();
                clearInterval(interval);
                if (collosionResult.tank !== null) {
                    collosionResult.tank.getDamage(activeTank.damage);
                }
                setTimeout(() => {
                    nextRound();
                }, TIME_AFTER_COLLOSION);
                return;//very important
            }

            for (let j = 0; j < allFences.length; j++) {
                if (allFences[j].isCollide(destX, destY)) {
                    allFences[j].demolish(destX, destY);
                    ctx.lineTo(destX, destY);
                    ctx.stroke();
                    ctx.closePath();
                    clearInterval(interval);
                    setTimeout(() => {
                        nextRound();
                    }, TIME_AFTER_COLLOSION);
                    return;
                }
            }

            ctx.lineTo(destX, destY);
        }
        ctx.stroke();
        ctx.closePath();
        intervalCounter++;
    }, 1);
}

function drawAim(tankParam) {
    let angleMultiplierX;
    let angleMultiplierY;
    let reverse;
    let x;
    let y;
    let shootFunction = tankParam.aimFunction;
    let param1 = tankParam.aimParams.p1;
    let param2 = tankParam.aimParams.p2;
    switch (activeTank.angle) {
        case 0:
            x = activeTank.x + activeTank.img.width / 2;
            y = activeTank.y;
            angleMultiplierX = -1;
            angleMultiplierY = 1;
            reverse = true;
            break;
        case 90:
            x = activeTank.x + activeTank.img.width;
            y = activeTank.y + activeTank.img.height / 2;
            angleMultiplierX = 1;
            angleMultiplierY = 1;
            reverse = false;
            break;
        case 180:
            x = activeTank.x + activeTank.img.width / 2;
            y = activeTank.y + activeTank.img.height;
            angleMultiplierX = 1;
            angleMultiplierY = 1;
            reverse = true;
            break;
        case 270:
            x = activeTank.x;
            y = activeTank.y + activeTank.img.height / 2;
            angleMultiplierX = -1;
            angleMultiplierY = -1;
            reverse = false;
            break;
    }

    ctx.beginPath();
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    ctx.moveTo(x, y);
    let prevX = x;
    let prevY = y;
    let destX;
    let destY;
    let allDistance = 0;
    let maxDistance = 500;
    for (let i = 0; allDistance < maxDistance; i++) {
        if (!reverse) {
            destX = x + angleMultiplierX * i;
            destY = y + angleMultiplierY * shootFunction(i, param1, param2);
        } else {
            destX = x + angleMultiplierY * shootFunction(i, param1, param2);
            destY = y + angleMultiplierX * i
        }
        allDistance += Math.sqrt(Math.pow(destX - prevX, 2) + Math.pow(destY - prevY, 2));
        prevX = destX;
        prevY = destY;
        ctx.lineTo(destX, destY);
    }
    ctx.stroke();
    ctx.closePath();
}

function updateFrame() {

    ctx.drawImage(images['desert'], 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);


    if (isAimInProgress) {
        drawAim(activeTank);
    }

    allFuels.forEach((fuel) => {
        fuel.draw();
    });

    allHeals.forEach((heal) => {
        heal.draw();
    });

    allFences.forEach((fence) => {
        fence.draw(ctx);
    });

    allTanks.forEach((tank) => {
        tank.draw();
    });

    updateInfoPanels();
}

function nextPlayer() {
    if (activePlayer === redPlayer) {
        return bluePlayer;
    } else {
        return redPlayer;
    }
}

function collosion(x, y) {
    if (x < 0 || x > CANVAS_WIDTH || y < 0 || y > CANVAS_HEIGHT) {
        console.log('wall collosion!');
        return {bool: true, tank: null};
    }
    for (let i = 0; i < allTanks.length; i++) {
        let tank = allTanks[i];
        if (x > tank.x && x < tank.x + tank.img.width && y > tank.y && y < tank.y + tank.img.height) {
            console.log('tankcollosion!');
            //returns bool value and the tank that was hit in object
            return {bool: true, tank: tank};
        }
    }
    return false;
}

function linear(x, param1, param2) {
    return -x * param1 / 100;
}

function sinus(x, param1, param2) {
    return -Math.sin(x / param2) * param1;
}
