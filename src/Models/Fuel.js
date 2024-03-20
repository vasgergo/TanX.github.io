import {Overlappable} from "../Services/Overlappable.js";
import {Random} from "../Services/Random.js";

export class Fuel{
    static image ;
    static ctx;

    constructor(x, y) {
        this.x = x;
        this.y = y;

        this.width = 30;
        this.height = 30;
        this.amount = 50;
    }

    draw() {
        Fuel.ctx.drawImage(Fuel.image, this.x, this.y, this.width, this.height);
    }

    isOverlap(tank) {
        return tank.x < this.x + this.width && tank.x + tank.img.width > this.x && tank.y < this.y + this.height && tank.y + tank.img.height > this.y;
    }

    static randomFuel(allOverlappables) {
        let result;
        let x = 0
        let y = 0
        let maxTry = 100;
        let isOverlap = true;

        while (isOverlap && maxTry > 0) {
            x = Random.getRandomInt(50, 1000);
            y = Random.getRandomInt(50, 450);
            result = new Fuel(x, y);
            isOverlap = false;
            for (let i = 0; i < allOverlappables.length; i++) {
                if (Overlappable.overlap(result, allOverlappables[i]).isOverlap) {
                    isOverlap = true;
                    break;
                }
            }
            maxTry--;
        }
        return result;
    }
}