import {Tank} from "./Models/Tank.js";
import {Player} from "./Models/Player.js";
import {Fence} from "./Models/Fence.js";
import {Heal} from "./Models/Heal.js";
import {Fuel} from "./Models/Fuel.js";
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

    canvas = document.getElementById('myCanvas');
    context = canvas.getContext('2d');

    Fence.image = images['fence'];


    bluePlayer = new Player('blue');

   bluePlayer.isBot = false

    bluePlayer.addTank(new Tank(100, 150, 'blue', 'light', 'right', images['blue_light'], context));



    allOverlappables.push(fences, heals, fuels, tanks);

    //----------PREDEFINED INITIALIZATION----------------


        fences.push(new Fence(350, 100, 'tank_trap', 10));
        fences.push(new Fence(350, 400, 'tank_trap', 10));
        fences.push(new Fence(700, 100, 'tank_trap', 10));
        fences.push(new Fence(700, 400, 'tank_trap', 10));
        fences.push(new Fence(480, 250, 'tank_trap', 10));



        // for (let i = 0; i < 10; i++) {
        //     heals.push(Heal.randomHeal(allOverlappables));
        // }



        console.log(allOverlappables);


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
    updateFrame()

    activePlayer.turn().then(() => {
        startNextRound();
    });

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
