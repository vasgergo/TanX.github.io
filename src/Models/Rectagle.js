import {Random} from "../Services/Random.js";
import {Overlappable} from "../Services/Overlappable.js";

export class Rectagle {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    isOverlap(rect) {
        return this.x < rect.x + rect.width &&
            this.x + this.width > rect.x &&
            this.y < rect.y + rect.height &&
            this.y + this.height > rect.y;
    }

    getCenter() {
        return {
            x: this.x + this.width / 2,
            y: this.y + this.height / 2
        };
    }

    placeRandomly(allOverlappables) {
        let maxTry = 100;
        let clone = new Rectagle(this.x, this.y, this.width, this.height);

        while (maxTry > 0) {
            clone.x = Random.getRandomInt(10, 1000);
            clone.y = Random.getRandomInt(10, 600);

            if (!isOverlapWithAll(clone, allOverlappables)) {
                this.x = clone.x;
                this.y = clone.y;
                return this;
            }
            console.log('overlap');
            maxTry--;
        }

        function isOverlapWithAll(rect, allOverlappables) {
            for (let i = 0; i < allOverlappables.length; i++) {
                for (let j = 0; j < allOverlappables[i].length; j++) {
                    if (rect.isOverlap(allOverlappables[i][j])) {
                        return true;
                    }
                }
            }
            return false;
        }
    }




}