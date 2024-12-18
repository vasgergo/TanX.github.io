import {Random} from "../Services/Random.js";
import {Overlappable} from "../Services/Overlappable.js";
import {Rectagle} from "./Rectagle.js";

export class Heal extends Rectagle{
    static image;
    static ctx;

    constructor(x, y) {
        super(x, y, 30, 30);
        this.amount = 20;
    }

    draw() {
        Heal.ctx.drawImage(Heal.image, this.x, this.y, this.width, this.height);
    }


    static randomHeal(allOverlappables) {
        let result;
        let x = 0
        let y = 0
        let maxTry = 100;
        let isOverlap = true;

        while (isOverlap && maxTry > 0) {
            x = Random.getRandomInt(50, 1000);
            y = Random.getRandomInt(50, 600);
            result = new Heal(x, y);
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