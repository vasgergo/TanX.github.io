import {Tank} from "./Models/Tank.js";
import {Player} from "./Models/Player.js";
import {Fence} from "./Models/Fence.js";
import {Heal} from "./Models/Heal.js";
import {Fuel} from "./Models/Fuel.js";
// import {Overlappable} from "./Services/Overlappable.js";
// import './Menu/menu.css';

const imagNames = ['desert', 'red_heavy', 'red_light', 'red_medium', 'blue_heavy', 'blue_light', 'blue_medium', 'fence', 'red_cross', 'fuel', 'heal'];

let CANVAS_WIDTH = document.getElementById('myCanvas').width;
let CANVAS_HEIGHT = document.getElementById('myCanvas').height;
const ORIGINAL_WINDOW_WIDTH = 1536;
const ORIGINAL_WINDOW_HEIGHT = 703;
const GAME_MODE = window.sessionStorage.getItem("playerMode")
let ctx;
let canvas;
let redPlayer;
let bluePlayer;
let players = [];
let images = [];
let isAimInProgress = false;
let allTanks = [];
let activePlayer;
let activeTank;
let allFences = [];
const ROUND_TIME = 30;
const TIME_AFTER_COLLISION = 1000;
console.log(GAME_MODE);
let pressed_down_keys = {};

//TIMER
let timerInterval;
let timerSeconds;

let moveAndAimInterval;
let shootInterval;

let allHeals = [];
let allFuels = [];
let allOverlappables = [];

window.onload = function () {
    loadImages();
    setGameContainerSizeAndPosition();
}

function loadImages() {
    function loadPngByName(imageName) {
        return new Promise((resolve) => {
            let img = new Image();
            img.src = './Pictures/' + imageName + '.png';
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
    //pressed_down_keys handling
    {
        window.addEventListener('keydown', (e) => {
            pressed_down_keys[e.key] = true;
        });

        window.addEventListener('keyup', (e) => {
            pressed_down_keys[e.key] = false;
        });
    }

    canvas = document.getElementById('myCanvas');
    ctx = canvas.getContext('2d');


    Heal.image = images['heal'];
    Fuel.image = images['fuel'];
    Fence.image = images['fence'];

    Heal.ctx = ctx;
    Fuel.ctx = ctx;

    //create players
    redPlayer = new Player('red');
    bluePlayer = new Player('blue');


    if (GAME_MODE === 'pvc') {
        bluePlayer.isBot = true;
    }
    players.push(bluePlayer);
    players.push(redPlayer);
    bluePlayer.addTank(new Tank(100, 150, 'blue', 'light', 'right', images['blue_light'], ctx));
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
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            // menu
        }
    });
    console.log('game started');
    updateFrame();
    startNextRound();
}

function startNextRound() {
    if (redPlayer.isLose() || bluePlayer.isLose()) {
        console.log('game over');
        window.location.href = 'index.html';
    } else {
        let pressEnter = window.document.getElementById('pressEnter');
        timerSeconds = ROUND_TIME;
        window.document.getElementById('timer').innerText = timerSeconds.toFixed(1);
        activePlayer = nextPlayer();
        activeTank = activePlayer.nextTank();
        console.log('->Active player is: ' + activePlayer.color + ' tank: ' + activeTank.type);
        updateInfoPanels();
        //set all tank class div background to red
        updateInfoPanelTankColor();
        document.getElementById(activeTank.team + '_' + activeTank.type).style.backgroundColor = 'lightgreen';
        if (activePlayer.color === 'blue') {
            document.getElementById('blueActiveTankImg').src = activeTank.img.src;
            document.getElementById('redActiveTankImg').src = images['red_cross'].src;
        } else {
            document.getElementById('redActiveTankImg').src = activeTank.img.src;
            document.getElementById('blueActiveTankImg').src = images['red_cross'].src;
        }

        pressEnter.style.display = 'flex';

        window.addEventListener('keypress', goNextRound);

        function goNextRound(e) {
            if (e.key === 'Enter') {
                pressEnter.style.display = 'none';
                window.removeEventListener('keypress', goNextRound);
                nextRound();
            }
        }
    }
}

function nextRound() {
    console.log('next round');
    timerInterval = setInterval(timer, 100);//start timer

    isAimInProgress = true;
    allHeals.push(Heal.randomHeal(allOverlappables));
    allFuels.push(Fuel.randomFuel(allOverlappables));
    updateFrame()

    if (activePlayer.isBot) {
        let startTime = performance.now();

        botTurn();
        let endTime = performance.now();
        let executionTime = endTime - startTime;

        console.log("A kód futási ideje: " + executionTime.toFixed(0) + " milliszekundum.");

    } else {
        moveAndAimInterval = setInterval(aimAndMove, 1000 / 50);
        window.addEventListener('keypress', rotationAndShootControl);
    }

    function aimAndMove() {
        let isUpdated = false;
        if (pressed_down_keys['w']) {
            activeTank.move('up', allFences, allTanks, allHeals, allFuels, canvas);
            isUpdated = true;
        }
        if (pressed_down_keys['s']) {
            activeTank.move('down', allFences, allTanks, allHeals, allFuels, canvas);
            isUpdated = true;
        }
        if (pressed_down_keys['a']) {
            activeTank.move('left', allFences, allTanks, allHeals, allFuels, canvas);
            isUpdated = true;
        }
        if (pressed_down_keys['d']) {
            activeTank.move('right', allFences, allTanks, allHeals, allFuels, canvas);
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

function botTurn() {
    console.log('bot turns');
    let path = getPathAStar(activeTank, 180, 170);

    console.log(path);

    for (let i = 0; i < path.length; i++) {
        ctx.beginPath();
        ctx.strokeStyle = 'blue';
        ctx.lineWidth = 1;
        ctx.moveTo(path[i].x, path[i].y);
        ctx.lineTo(path[i].x + 1, path[i].y + 1);
        ctx.stroke();
    }

    /*
    let shootOptions = getShootOptions();
    if (shootOptions.number) {
        console.log("van option");
        activeTank.aimParams.p1 = shootOptions.p1[0];
        activeTank.aimParams.p2 = shootOptions.p2[0];
    } else {
        console.log("nincs opció");
    }
    endRound();
    shoot(activeTank);


    function getShootOptions() {
        let p1Arr = [];
        let p2Arr = [];
        for (let i = Tank.paramInterval.p1.min; i <= Tank.paramInterval.p1.max; i++) {
            for (let j = Tank.paramInterval.p2.min; j <= Tank.paramInterval.p2.max; j++) {
                let shootRes = shootResult();
                activeTank.setAimParams(i, j);
                if (shootRes instanceof Tank && shootRes.team !== activeTank.team) {
                    p1Arr.push(i);
                    p2Arr.push(j);
                }
            }
        }
        return {p1: p1Arr, p2: p2Arr, number: p1Arr.length};
    }*/
}

function getPathAStar(tank, destX, destY) {
    console.log('getPathAStar');
    console.log(tank.x, tank.y, destX, destY);

    let openList = [];
    let closedList = [];
    let current;

    openList.push({
        x: tank.x,
        y: tank.y,
        dist: 0,
        parent: null
    });




    let pfc = 0;
    openList.pullFirst = function () {
        pfc++;
        ctx.beginPath();
        ctx.strokeStyle = 'red';
        ctx.fillRect(this[0].x, this[0].y, 1, 1);
        ctx.stroke();

        this.sort((a, b) => {
            return a.dist + getHeuristic(a) - b.dist - getHeuristic(b);
        });

        return this.splice(0, 1)[0];
    };

    while (openList.length > 0) {
        current = openList.pullFirst();
        if (current.x === destX && current.y === destY) {
            console.log("pfv: ", pfc);
            ctx.beginPath();
            ctx.strokeStyle = 'green';
            ctx.lineWidth = 1;
            ctx.moveTo(current.x, current.y);
            ctx.lineTo(current.x + 1, current.y + 1);
            ctx.stroke();
            return linkedListToArray(current);
        }
        closedList.push(current);
        let neighbours = getNeighbours(current);
        for (let i = 0; i < neighbours.length; i++) {
            if (!isOnList(openList, neighbours[i]) && (!isOnList(closedList, neighbours[i])) || current.cost + 1 < neighbours[i].cost) {
                openList.push(neighbours[i]);
                removeFromList(closedList, neighbours[i]);
                neighbours[i].cost = current.cost + 1;
                neighbours[i].parent = current;
            }
        }
    }
    return "no path";

    function getHeuristic(point) {
        return Math.sqrt(Math.pow(point.x - destX, 2) + Math.pow(point.y - destY, 2));
    }

    function isOnList(list, point) {
        for (let i = 0; i < list.length; i++) {
            if (list[i].x === point.x && list[i].y === point.y) {
                return true;
            }
        }
        return false;
    }

    function linkedListToArray(head) {
        let path = [];
        let temp = head;
        while (temp) {
            path.push(temp);
            temp = temp.parent;
        }
        return path.reverse();
    }

    function removeFromList(list, point) {
        for (let i = 0; i < list.length; i++) {
            if (list[i].x === point.x && list[i].y === point.y) {
                list.splice(i, 1);
                return;
            }
        }
    }

    function getNeighbours(current) {
        let neighbours = [];
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                if (i === 0 && j === 0) {
                    continue;
                }
                for (let k = 0; k < allFences.length; k++) {
                    if (!allFences[k].isOverlap({x: current.x + i, y: current.y + j, width:tank.width, height:tank.height})) {
                        neighbours.push({
                            x: current.x + i,
                            y: current.y + j,
                            dist: current.dist + 1,
                            parent: current
                        });
                    }
                }
            }
        }
        return neighbours;
    }

}

function endRound() {
    isAimInProgress = false;
    if (!activePlayer.isBot) {
        clearInterval(moveAndAimInterval);
        window.removeEventListener('keypress', rotationAndShootControl);
    }
    clearInterval(timerInterval);
}

function rotationAndShootControl(e) {
    if (e.key === '8' || e.key === '6' || e.key === '2' || e.key === '4') {
        isAimInProgress = false;
        window.removeEventListener('keypress', rotationAndShootControl);
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
        case"5":
            activeTank.changeReflection();
            updateFrame();
            break;
        case 'Enter':
            endRound()
            shoot(activeTank);
            break;
    }

    function callback() {
        if (timerSeconds !== ROUND_TIME) {
            isAimInProgress = true;
            updateFrame();
            window.addEventListener('keypress', rotationAndShootControl);
        }
    }
}

function objectAt(x, y) {
    if (x < 0 || x > CANVAS_WIDTH || y < 0 || y > CANVAS_HEIGHT) {
        return "wall";
    }
    for (let i = 0; i < allFences.length; i++) {
        if (allFences[i].isCollide(x, y)) {
            return allFences[i];
        }
    }
    for (let i = 0; i < allTanks.length; i++) {
        if (allTanks[i].x < x && allTanks[i].x + allTanks[i].img.width > x && allTanks[i].y < y && allTanks[i].y + allTanks[i].img.height > y) {
            return allTanks[i];
        }
    }
    return undefined;
}

function shoot(tankParam) {
    isAimInProgress = false;
    updateFrame();
    console.log('shoot');
    let distance = 0;
    ctx.beginPath();
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 1;
    ctx.moveTo(tankParam.aimParams.startX, tankParam.aimParams.startY);
    ctx.stroke();

    let destX;
    let destY;
    let objectAtPoint;

    shootInterval = setInterval(() => {
        distance += 1;

        console.log('shoot interval');

        destX = tankParam.shootFunction(distance).x;
        destY = tankParam.shootFunction(distance).y;

        ctx.lineTo(destX, destY);
        ctx.stroke();

        objectAtPoint = objectAt(destX, destY);

        if (!objectAtPoint) {
        } else if (objectAtPoint === 'wall') {
            clearInterval(shootInterval);
            setTimeout(() => {
                startNextRound();
            }, TIME_AFTER_COLLISION);
        } else if (objectAtPoint instanceof Tank) {
            if (objectAtPoint !== tankParam) {
                objectAtPoint.getDamage(tankParam.damage);
                clearInterval(shootInterval);
                setTimeout(() => {
                    startNextRound();
                }, TIME_AFTER_COLLISION);
            }
        } else if (objectAtPoint instanceof Fence) {
            objectAtPoint.demolish(destX, destY);
            clearInterval(shootInterval);
            clearInterval(shootInterval);
            setTimeout(() => {
                startNextRound();
            }, TIME_AFTER_COLLISION);
        }

    }, 1);
}

function drawAim(tankParam) {
    tankParam.updateAimParams();
    ctx.beginPath();
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 1;
    ctx.moveTo(tankParam.aimParams.startX, tankParam.aimParams.startY);
    let prevX = tankParam.aimParams.startX;
    let prevY = tankParam.aimParams.startY;
    let destX;
    let destY;
    let allDistance = 0;
    let maxDistance = 500;
    for (let i = 0; allDistance < maxDistance; i++) {
        destX = tankParam.shootFunction(i).x;
        destY = tankParam.shootFunction(i).y;

        allDistance += Math.sqrt(Math.pow(destX - prevX, 2) + Math.pow(destY - prevY, 2));
        prevX = destX;
        prevY = destY;
        ctx.lineTo(destX, destY);
    }
    ctx.stroke();
    ctx.closePath();
}

function updateFrame() {
    console.log('update frame');
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

function timer() {
    if (timerSeconds <= 5) {
        // start beep sound

        window.document.getElementById('timer').style.color = 'red';
    } else {
        window.document.getElementById('timer').style.color = 'black';
    }
    if (timerSeconds <= 0) {
        window.document.getElementById('timer').innerText = '0.0';
        console.log('time is up');
        clearInterval(timerInterval);
        endRound();
        setTimeout(() => {
            startNextRound();
            endRound();
        }, TIME_AFTER_COLLISION);
    } else {
        window.document.getElementById('timer').innerText = timerSeconds.toFixed(1);
        timerSeconds -= 0.1;
    }
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

function menuOpen() {
    let menu = document.getElementById('menu');
    menu.style.display = 'flex';
}

function menuClose() {
    let menu = document.getElementById('menu');
    menu.style.display = 'none';
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

window.onresize = function () {
    setGameContainerSizeAndPosition();
}

function setGameContainerSizeAndPosition() {
    let gameContainer = document.getElementById('gameContainer');

    let window_width = window.innerWidth;
    let window_height = window.innerHeight;
    let centerOfWindowWidth = window_width / 2;
    let centerOfWindowHeight = window_height / 2;

    let width_scale = Number((window_width / ORIGINAL_WINDOW_WIDTH).toFixed(3));
    let height_scale = Number((window_height / ORIGINAL_WINDOW_HEIGHT).toFixed(3));

    let scale = Math.min(width_scale, height_scale);

    let gameContainerCurr_width = scale * ORIGINAL_WINDOW_WIDTH;

    let gameContainerCurr_height = scale * ORIGINAL_WINDOW_HEIGHT;

    gameContainer.style.scale = scale.toString();

    gameContainer.style.top = centerOfWindowHeight - (gameContainerCurr_height / 2) + 'px';
    gameContainer.style.left = centerOfWindowWidth - (gameContainerCurr_width / 2) + 'px';

}

function shootResult() {
    let destX;
    let destY;
    let distance = 0;
    while (true) {
        distance++;
        destX = activeTank.shootFunction(distance).x;
        destY = activeTank.shootFunction(distance).y;
        let objectAtPoint = objectAt(destX, destY);
        if (objectAtPoint !== undefined) {
            return objectAtPoint;
        }
    }
}

