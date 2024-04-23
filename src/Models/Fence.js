import {Random} from "../Services/Random.js";
import {Overlappable} from "../Services/Overlappable.js";
import {Rectagle} from "./Rectagle.js";

export class Fence extends Rectagle{
    static image;

    constructor(x, y, type, blockSize) {
        super(x, y, 0, 0);
        this.x = x;
        this.y = y;
        this.blockSzie = blockSize;
        this.type = type;
        this.array = [];

        //type will be init these values
        this.heightNum = undefined;
        this.widthNum = undefined;
        this.height = undefined;
        this.width = undefined;

        this.initWall(type);
    }


    initWall(type) {
        let wallShapeArray = createShape(type);
        this.heightNum = wallShapeArray.length;
        this.widthNum = wallShapeArray[0].length;

        this.height = wallShapeArray.length * this.blockSzie;
        this.width = wallShapeArray[0].length * this.blockSzie;

        for (let i = 0; i < this.heightNum; i++) {
            for (let j = 0; j < this.widthNum; j++) {
                if (wallShapeArray[i][j] === 1) {
                    this.array.push({
                        x: this.x + j * this.blockSzie,
                        y: this.y + i * this.blockSzie,
                        exist: wallShapeArray[i][j]
                    });
                }
            }
        }


        function createShape(type) {
            let shape = [];
            switch (type) {
                case 'normal_x':
                    shape = [
                        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
                        [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
                        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
                        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
                    ];
                    break;
                case 'normal_y':
                    shape = [
                        [1, 1, 1, 1, 1],
                        [1, 0, 0, 0, 1],
                        [1, 0, 1, 0, 1],
                        [1, 0, 0, 0, 1],
                        [1, 0, 1, 0, 1],
                        [1, 0, 0, 0, 1],
                        [1, 0, 1, 0, 1],
                        [1, 0, 0, 0, 1],
                        [1, 0, 1, 0, 1],
                        [1, 0, 0, 0, 1],
                        [1, 0, 1, 0, 1],
                        [1, 0, 0, 0, 1],
                        [1, 0, 1, 0, 1],
                        [1, 0, 0, 0, 1],
                        [1, 1, 1, 1, 1]
                    ];
                    break;
                case 'normal_round':
                    shape = [
                        [0, 0, 0, 0, 1, 0, 0, 0, 0],
                        [0, 0, 0, 1, 1, 1, 0, 0, 0],
                        [0, 0, 1, 1, 1, 1, 1, 0, 0],
                        [0, 1, 1, 1, 0, 1, 1, 1, 0],
                        [1, 1, 1, 0, 0, 0, 1, 1, 1],
                        [0, 1, 1, 1, 0, 1, 1, 1, 0],
                        [0, 0, 1, 1, 1, 1, 1, 0, 0],
                        [0, 0, 0, 1, 1, 1, 0, 0, 0],
                        [0, 0, 0, 0, 1, 0, 0, 0, 0]
                    ];
                    break;
                case 'tank_trap':
                    shape = [
                        [0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0],
                        [0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0],
                        [0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0],
                        [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
                        [0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0],
                        [0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0],
                        [0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0],
                        [0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0],
                        [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
                        [0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0],
                        [0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0],
                        [0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0]
                    ];
                    break;
                default:
                    console.log('No such type');
                    break;
            }
            return shape;
        }
    }

    static randomWalls(image, allOvarlappables) {
        let result = [];
        let numbersOfTypes = {
            normal_x: 0,
            normal_y: 0,
            normal_round: 0,
            tank_trap: 4
        };

        for (let type in numbersOfTypes) {
            let max = 10;
            while (numbersOfTypes[type] > 0) {
                if (max < 0) {
                    break;
                }
                //canvas size is 1100x650
                let x = Random.getRandomInt(50, 1000);
                let y = Random.getRandomInt(50, 450);
                let wall = new Fence(x, y, type, 10, image);
                if (!Overlappable.overlap(wall, result).isOverlap && !Overlappable.overlap(wall, allOvarlappables).isOverlap) {
                    result.push(wall);
                    numbersOfTypes[type]--;
                }
                max--;
            }
        }
        console.log(result);

        return result;

    }

    draw(ctx) {
        for (const block in this.array) {
            if (this.array[block].exist) {
                ctx.drawImage(Fence.image, this.array[block].x, this.array[block].y, this.blockSzie, this.blockSzie);
            }
        }
    }

    isCollide(x, y) {
        if (x < this.x || x > this.x + this.width || y < this.y || y > this.y + this.height) {
            return false;
        } else {
            for (let i = 0; i < this.array.length; i++) {
                if (this.array[i].exist) {
                    if (x > this.array[i].x && x < this.array[i].x + this.blockSzie && y > this.array[i].y && y < this.array[i].y + this.blockSzie) {
                        return true;
                    }
                }
            }
        }
    }

    isOverlap(tank) {
        for (let i = 0; i < this.array.length; i++) {
            if (this.array[i].exist) {
                if (tank.x < this.array[i].x + this.blockSzie && tank.x + tank.width > this.array[i].x && tank.y < this.array[i].y + this.blockSzie && tank.y + tank.height > this.array[i].y) {
                    return true;
                }
            }
        }
        return false;
    }

//demolish couse a round bumm effect centered at the x, y
    demolish(x, y, bummSize = 40) {
        let blockCenterX;
        let blockCenterY;
        for (let i = 0; i < this.array.length; i++) {
            blockCenterX = this.array[i].x + this.blockSzie / 2;
            blockCenterY = this.array[i].y + this.blockSzie / 2;
            if (Math.sqrt((blockCenterX - x) ** 2 + (blockCenterY - y) ** 2) < bummSize) {
                this.array[i].exist = false;
            }
        }
    }
}