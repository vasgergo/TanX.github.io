import {Overlappable} from "../Services/Overlappable.js";
import {Random} from "../Services/Random.js";
import {Rectagle} from "./Rectagle.js";

export class Fuel extends Rectagle{
    static image ;
    static ctx;

    constructor(x, y) {
        super(x, y, 30, 30);
        this.amount = 50;
    }

    draw() {
        Fuel.ctx.drawImage(Fuel.image, this.x, this.y, this.width, this.height);
    }

    static randomFuel(allOverlappables) {
        let result;
        let x = 0
        let y = 0
        let maxTry = 100;
        let isOverlap = true;

        while (isOverlap && maxTry > 0) {
            x = Random.getRandomInt(50, 1000);
            y = Random.getRandomInt(50, 600);
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