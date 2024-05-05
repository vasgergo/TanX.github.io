import {Tank} from "./Models/Tank.js";
import {Player} from "./Models/Player.js";
import {Fence} from "./Models/Fence.js";
import {Heal} from "./Models/Heal.js";
import {Fuel} from "./Models/Fuel.js";
import {Timer} from "./Models/Timer.js";
// import {Overlappable} from "./Services/Overlappable.js";

const imagNames = ['desert', 'red_heavy', 'red_light', 'red_medium', 'blue_heavy', 'blue_light', 'blue_medium', 'fence', 'red_cross', 'fuel', 'heal'];

let CANVAS_WIDTH = document.getElementById('myCanvas').width;
let CANVAS_HEIGHT = document.getElementById('myCanvas').height;
const ORIGINAL_WINDOW_WIDTH = 1536;
const ORIGINAL_WINDOW_HEIGHT = 703;
const GAME_MODE = window.sessionStorage.getItem("playerMode");

export let context;
export let canvas;

let redPlayer;
let bluePlayer;
let players = [];

let images = [];
let activePlayer;
export let activeTank;
const ROUND_TIME = 30;
console.log(GAME_MODE);
export let pressed_down_keys = {};

export let timerO = new Timer(ROUND_TIME);

//TIMER

let moveAndAimInterval;
let shootInterval;

export let heals = [];
export let fuels = [];
export let fences = [];
export let tanks = [];

export let sounds = {};


let allOverlappables = [];

window.onload = function () {
    loadImages();
    setGameContainerSizeAndPosition();
}

function loadImages() {

    //load sounds
    sounds = {
        'fence_bumm': new Audio('./Sounds/fence_bumm.mp3'),
        'tank_fire': new Audio('./Sounds/tank_fire.mp3'),
        'aiming': new Audio('./Sounds/aiming.mp3'),
        'ai_thinking': new Audio('./Sounds/ai_thinking.mp3'),
    }

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

    timerO.addEventListener('onChange', updateTimeDisplay);

    canvas = document.getElementById('myCanvas');
    context = canvas.getContext('2d');

    Heal.image = images['heal'];
    Fuel.image = images['fuel'];
    Fence.image = images['fence'];

    Heal.ctx = context;
    Fuel.ctx = context;

    //create players
    redPlayer = new Player('red');
    bluePlayer = new Player('blue');


    if (GAME_MODE === 'pvc') {
        bluePlayer.isBot = true;
        redPlayer.isBot = true;
    }
    players.push(bluePlayer);
    players.push(redPlayer);
    bluePlayer.addTank(new Tank(100, 150, 'blue', 'light', 'up', images['blue_light'], context));
    bluePlayer.addTank(new Tank(100, 300, 'blue', 'medium', 'right', images['blue_medium'], context));
    bluePlayer.addTank(new Tank(100, 450, 'blue', 'heavy', 'right', images['blue_heavy'], context));
    redPlayer.addTank(new Tank(930, 150, 'red', 'light', 'left', images['red_light'], context));
    redPlayer.addTank(new Tank(890, 310, 'red', 'medium', 'left', images['red_medium'], context));
    redPlayer.addTank(new Tank(950, 430, 'red', 'heavy', 'left', images['red_heavy'], context));

    players.forEach((player) => {
        player.tanks.forEach((tank) => {
            tanks.push(tank);
        });
    });

    let randomInit = false;

    allOverlappables.push(fences, heals, fuels, tanks);

    //----------PREDEFINED INITIALIZATION----------------

    if (!randomInit) {

        fences.push(new Fence(350, 100, 'tank_trap', 10));
        fences.push(new Fence(350, 400, 'tank_trap', 10));
        fences.push(new Fence(700, 100, 'tank_trap', 10));
        fences.push(new Fence(700, 400, 'tank_trap', 10));
        fences.push(new Fence(480, 250, 'tank_trap', 10));


        heals.push(new Heal(200, 200));
        heals.push(new Heal(500, 400));
        heals.push(new Heal(500, 400));

        // for (let i = 0; i < 10; i++) {
        //     heals.push(Heal.randomHeal(allOverlappables));
        // }

        fuels.push(new Fuel(700, 270));
        fuels.push(new Fuel(700, 270));
        fuels.push(new Fuel(700, 270));
        fuels.push(new Fuel(500, 150));

        console.log(allOverlappables);
    }
    //-----------RANDOM INITIALIZATION----------------

    if (randomInit) {
        fences = Fence.randomWalls(images['fence'], allOverlappables);
        allOverlappables.push(fences);
        for (let i = 0; i < 10; i++) {
            heals.push(Heal.randomHeal(allOverlappables));
        }
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

export function startNextRound() {
    if (redPlayer.isLose() || bluePlayer.isLose()) {
        console.log('game over');
        window.location.href = 'index.html';
    } else {
        for (let i = 0; i < tanks.length; i++) {
            tanks[i].addFuel(30);
        }
        heals.push(Heal.randomHeal(allOverlappables));
        fuels.push(Fuel.randomFuel(allOverlappables));
        timerO.reset();

        let roundInfo = window.document.getElementById('roundInfo');
        let nextPlayerColor = window.document.getElementById('nextPlayerColor');
        window.document.getElementById('timer').innerText = timerO.getTime();
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
            nextPlayerColor.style.color = 'blue';
            nextPlayerColor.innerText = 'blue';
        } else {
            document.getElementById('redActiveTankImg').src = activeTank.img.src;
            document.getElementById('blueActiveTankImg').src = images['red_cross'].src;
            nextPlayerColor.style.color = 'red';
            nextPlayerColor.innerText = 'red';
        }
        let pressEnter = document.getElementById('pressEnter');
        if (activePlayer.isBot) {
            sounds['ai_thinking'].play();
            pressEnter.innerText = 'AI is thinking...';

            activePlayer.calculateOptions(callback);

            function callback() {
                sounds['ai_thinking'].pause();
                sounds['ai_thinking'].currentTime = 0;
                pressEnter.innerText = 'Ai is ready, press enter to start next round';
                window.addEventListener('keypress', goNextRound);
            }
        } else {
            pressEnter.innerText = 'Press enter to start next round';
            window.addEventListener('keypress', goNextRound);
        }

        roundInfo.style.display = 'initial';

        function goNextRound(e) {
            if (e.key === 'Enter') {
                roundInfo.style.display = 'none';
                window.removeEventListener('keypress', goNextRound);
                nextRound();
            }
        }
    }
}

function nextRound() {
    console.log('next round');
    timerO.start();


    updateFrame()

    activePlayer.turn().then(() => {
        startNextRound();
    });

    // getPathAStar(activeTank, 200, 200);


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
        context.beginPath();
        context.strokeStyle = 'red';
        context.fillRect(this[0].x, this[0].y, 1, 1);
        context.stroke();

        this.sort((a, b) => {
            return a.dist + getHeuristic(a) - b.dist - getHeuristic(b);
        });

        return this.splice(0, 1)[0];
    };

    while (openList.length > 0) {
        current = openList.pullFirst();
        if (current.x === destX && current.y === destY) {
            console.log("pfv: ", pfc);
            context.beginPath();
            context.strokeStyle = 'green';
            context.lineWidth = 1;
            context.moveTo(current.x, current.y);
            context.lineTo(current.x + 1, current.y + 1);
            context.stroke();
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
                let isFence = false;
                for (let k = 0; k < fences.length; k++) {
                    if (fences[k].isOverlap({
                        x: current.x + i,
                        y: current.y + j,
                        width: tank.width,
                        height: tank.height
                    })) {
                        isFence = true;
                        break;
                    }
                }
                if (!isFence) {
                    neighbours.push({
                        x: current.x + i,
                        y: current.y + j,
                        dist: current.dist + 1,
                        parent: current
                    });
                }
            }
        }
        return neighbours;
    }
}

export function objectAt(x, y) {
    if (x < 0 || x > CANVAS_WIDTH || y < 0 || y > CANVAS_HEIGHT) {
        return "wall";
    }
    for (let i = 0; i < fences.length; i++) {
        if (fences[i].isCollide(x, y)) {
            return fences[i];
        }
    }
    for (let i = 0; i < tanks.length; i++) {
        if (tanks[i].x < x && tanks[i].x + tanks[i].img.width > x && tanks[i].y < y && tanks[i].y + tanks[i].img.height > y) {
            return tanks[i];
        }
    }
    return undefined;
}

export function drawExplosionAnimation(x, y, size) {

    let counter = 1;
    let interval = setInterval(() => {
        if (counter > size) {
            clearInterval(interval);
        }
        context.beginPath();
        context.arc(x, y, counter, 0, 2 * Math.PI);
        context.fillStyle = 'red';
        context.fill();
        context.closePath();

        counter = counter * 1.1;
    }, 10);
}

function drawAim(tankParam) {
    tankParam.updateAimParams();
    context.beginPath();
    context.strokeStyle = 'red';
    context.lineWidth = 1;
    context.moveTo(tankParam.aimParams.startX, tankParam.aimParams.startY);
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
        context.lineTo(destX, destY);
    }
    context.stroke();
    context.closePath();
}

export function updateFrame() {
    context.drawImage(images['desert'], 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    if (activeTank && activeTank.isAiming) {
        drawAim(activeTank);
    }

    fuels.forEach((fuel) => {
        fuel.draw();
    });

    heals.forEach((heal) => {
        heal.draw();
    });

    fences.forEach((fence) => {
        fence.draw(context);
    });

    tanks.forEach((tank) => {
        tank.draw();
    });

    Player.drawUtilityHeatMap();

    updateInfoPanels();
}

function nextPlayer() {
    if (activePlayer === redPlayer) {
        return bluePlayer;
    } else {
        return redPlayer;
    }
}

function updateTimeDisplay() {
    let timeDisplay = document.getElementById('timer');
    let time = timerO.getTime();
    timeDisplay.innerText = time;
    if (time <= 5) {
        // start beep sound
        timeDisplay.style.color = 'red';
    } else {
        timeDisplay.style.color = 'black';
    }
}

function updateInfoPanelTankColor() {
    let color;
    for (let i = 0; i < tanks.length; i++) {
        if (tanks[i] === activeTank) {
            color = 'green';
        } else if (tanks[i].isCrashed) {
            color = 'red';
        } else {
            color = 'white';
        }
        document.getElementById(tanks[i].team + '_' + tanks[i].type).style.backgroundColor = color;
    }
}



function updateInfoPanels() {
    let actualTankColor;
    let actualTankType;
    for (let i = 0; i < tanks.length; i++) {
        actualTankColor = tanks[i].team;
        actualTankType = tanks[i].type;
        document.getElementById(actualTankColor + '_' + actualTankType + '_' + 'health').innerText = tanks[i].health;
        document.getElementById(actualTankColor + '_' + actualTankType + '_' + 'fuel').innerText = tanks[i].fuel.toFixed(1);
        document.getElementById(actualTankColor + '_' + actualTankType + '_' + 'consumption').innerText = tanks[i].consumption;
        document.getElementById(actualTankColor + '_' + actualTankType + '_' + 'damage').innerText = tanks[i].damage;
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

