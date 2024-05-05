import {
    canvas,
    fences,
    heals,
    tanks,
    fuels,
    context,
    sounds,
    drawExplosionAnimation,
    objectAt,
    updateFrame, activeTank

} from '../game.js';
import {Fence} from "./Fence.js";
import {Rectagle} from "./Rectagle.js";

export class Tank extends Rectagle {
    constructor(x, y, team, type, direction, image) {
        super(x, y, null, null);

        this.type = type;
        this.team = team;
        this.direction = direction;
        this.img = image;

        this.isAiming = false;

        this.health = undefined;
        this.fuel = undefined;
        this.consumption = undefined;
        this.damage = undefined;
        this.roationSpeed = undefined;
        this.roationSpeed = undefined;

        switch (this.type) {
            case 'light':
                this.width = 30;
                this.height = 30;
                this.maxHealth = 100;
                this.health = 99;
                this.maxFuel = 100;
                this.fuel = 100;
                this.consumption = 30;
                this.damage = 10;
                this.speed = 1;
                this.roationSpeed = 5;
                break;
            case 'medium':
                this.width = 45;
                this.height = 45;
                this.maxHealth = 150;
                this.health = 1;
                this.maxFuel = 150;
                this.fuel = 150;
                this.consumption = 40;
                this.damage = 25;
                this.speed = 1;
                this.roationSpeed = 2;
                break;
            case 'heavy':
                this.width = 60;
                this.height = 60;
                this.maxHealth = 200;
                this.health = 200;
                this.maxFuel = 200;
                this.fuel = 200;
                this.consumption = 80;
                this.damage = 50;
                this.speed = 1;
                this.roationSpeed = 1;
                break;
        }

        this.img.width = this.width;
        this.img.height = this.height;

        this.aimParams = {
            p1: 50,
            p2: 50,
            reflection: 1,

            angleMultiplierX: undefined,
            angleMultiplierY: undefined,
            reverse: undefined,
            startX: undefined,
            startY: undefined,
        }

        this.angle = 0;
        switch (this.direction) {
            case 'up':
                this.angle = 0;
                break;
            case 'right':
                this.angle = 90;
                break;
            case 'down':
                this.angle = 180;
                break;
            case 'left':
                this.angle = 270;
                break;
        }

        this.isCrashed = false;
    }

    static paramInterval = {
        p1: {
            min: 20,
            max: 200,
            // min: 10,
            // max: 250,
        },
        p2: {
            min: 15,
            max: 180,
            // min: 10,
            // max: 250,
        }
    }

    addHealth(amount) {
        this.health += amount;
        if (this.health > this.maxHealth) {
            this.health = this.maxHealth;
        }
    }

    addFuel(amount) {
        this.fuel += amount;
        if (this.fuel > this.maxFuel) {
            this.fuel = this.maxFuel;
        }
    }

    addToAimParams(p1, p2) {
        if (this.aimParams.p1 + p1 < Tank.paramInterval.p1.min || this.aimParams.p1 + p1 > Tank.paramInterval.p1.max || this.aimParams.p2 + p2 < Tank.paramInterval.p2.min || this.aimParams.p2 + p2 > Tank.paramInterval.p2.max) {
            console.log('Out of range');
        } else {
            this.aimParams.p1 += p1;
            this.aimParams.p2 += p2;
        }
        updateFrame();
    }


    setAimParams(p1, p2) {
        if (p1 < Tank.paramInterval.p1.min || p1 > Tank.paramInterval.p1.max || p2 < Tank.paramInterval.p2.min || p2 > Tank.paramInterval.p2.max) {
            console.log('Out of range');
        } else {
            this.aimParams.p1 = p1;
            this.aimParams.p2 = p2;
        }
    }

    updateAimParams() {
        switch (this.angle) {
            case 0:
                this.aimParams.startX = this.x + this.img.width / 2;
                this.aimParams.startY = this.y;
                this.aimParams.angleMultiplierX = -1;
                this.aimParams.angleMultiplierY = -1;
                this.aimParams.reverse = true;
                break;
            case 90:
                this.aimParams.startX = this.x + this.img.width;
                this.aimParams.startY = this.y + this.img.height / 2;
                this.aimParams.angleMultiplierX = 1;
                this.aimParams.angleMultiplierY = -1;
                this.aimParams.reverse = false;
                break;
            case 180:
                this.aimParams.startX = this.x + this.img.width / 2;
                this.aimParams.startY = this.y + this.img.height;
                this.aimParams.angleMultiplierX = 1;
                this.aimParams.angleMultiplierY = 1;
                this.aimParams.reverse = true;
                break;
            case 270:
                this.aimParams.startX = this.x;
                this.aimParams.startY = this.y + this.img.height / 2;
                this.aimParams.angleMultiplierX = -1;
                this.aimParams.angleMultiplierY = 1;
                this.aimParams.reverse = false;
                break;
        }

    }

    shootFunction(distanceFromStartPoint) {
        let result = {
            x: undefined,
            y: undefined,
        }

        if (this.aimParams.reverse) {
            result.x = this.aimParams.startX + this.aimParams.angleMultiplierY * this.aimParams.reflection * Math.sin(distanceFromStartPoint / this.aimParams.p2) * this.aimParams.p1;
            result.y = this.aimParams.startY + this.aimParams.angleMultiplierX * distanceFromStartPoint;
        } else {
            result.x = this.aimParams.startX + this.aimParams.angleMultiplierX * distanceFromStartPoint;
            result.y = this.aimParams.startY + this.aimParams.angleMultiplierY * this.aimParams.reflection * Math.sin(distanceFromStartPoint / this.aimParams.p2) * this.aimParams.p1;
        }
        return result;
    }

    changeReflection() {
        this.aimParams.reflection = -1 * this.aimParams.reflection;
    }

    rotationAnimation(destinationAngle, callback) {
        this.angle = this.angle % 360;

        if (this.angle === destinationAngle) {
            callback();
            return;
        }
        let rotationDirection = ((destinationAngle - this.angle + 360) % 360 > 180) ? -1 : 1;

        let interval = setInterval(() => {
            this.angle += rotationDirection * this.roationSpeed
            this.angle = this.angle % 360;
            if (this.angle < 0) {
                this.angle += 360;
            }

            updateFrame();

            if (this.angle === destinationAngle) {
                console.log('clear');
                clearInterval(interval);
                callback();
            }
        }, 20);

    }

    move(direction) {
        let x = 0;
        let y = 0;
        if (this.fuel <= 0) {
            console.log('No fuel');
            return;
        }

        switch (direction) {
            case 'up':
                y = -1 * this.speed;
                break;
            case 'down':
                y = this.speed;
                break;
            case 'left':
                x = -1 * this.speed;
                break;
            case 'right':
                x = this.speed;
                break;
        }

        let tankClone = new Tank(this.x + x, this.y + y, this.team, this.type, this.direction, this.img, this.context)


        //check if it is out of canvas
        if (tankClone.x < 0 || tankClone.x > canvas.width - tankClone.width || tankClone.y < 0 || tankClone.y > canvas.height - tankClone.height) {
            console.log('Canvas');
            return;
        }


        //check if there is a heal in the way
        for (let i = 0; i < heals.length; i++) {
            if (heals[i].isOverlap(tankClone)) {
                this.addHealth(heals[i].amount);
                heals.splice(i, 1);
                break;
            }
        }

        //check if there is a fuel in the way
        for (let i = 0; i < fuels.length; i++) {
            if (fuels[i].isOverlap(tankClone)) {
                this.addFuel(fuels[i].amount);
                fuels.splice(i, 1);
                break;
            }
        }

        //check if there is a fence in the way
        for (let i = 0; i < fences.length; i++) {
            if (fences[i].isOverlap(tankClone)) {
                console.log('Fence');
                return;
            }
        }
        //check if there is a tank in the way
        for (let i = 0; i < tanks.length; i++) {
            //do not check with itself
            if (tanks[i] === this) {
                continue;
            }
            if (tanks[i].isOverlap(tankClone)) {
                console.log('overlapping with: ', tanks[i].team + ' ' + tanks[i].type);
                return;
            }
        }

        //if there is no fence or tank then move
        this.x += x;
        this.y += y;
        this.fuel -= this.consumption / 100;
        updateFrame();
    }

    getDamage(damage) {
        this.health -= damage;
        if (this.health <= 0) {
            this.health = 0;
            document.getElementById(this.team + '_' + this.type).style.backgroundColor = 'red';
            this.isCrashed = true;
        }
    }

    isOverlap(tank) {
        return this.x < tank.x + tank.width && this.x + this.width > tank.x && this.y < tank.y + tank.height && this.y + this.height > tank.y;
    }

    draw() {
        let angle = this.angle;
        context.save();
        context.translate(this.x + this.img.width / 2, this.y + this.img.height / 2);
        context.rotate(angle * Math.PI / 180);

        //fuel indicator
        context.fillStyle = 'green';
        if (!this.isCrashed) {
            context.fillRect(-this.img.width / 2 - 5, this.img.width / 2, -5, -this.img.width * this.fuel / this.maxFuel); //y jobbra     x hatra    width jobbra   height hatra
        }

        //health indicator
        context.fillStyle = 'red';
        context.drawImage(this.img, -this.img.width / 2, -this.img.height / 2, this.img.width, this.img.height);

        context.fillRect(this.img.width / 2 + 5, this.img.width / 2, 5, -this.img.width * this.health / this.maxHealth); //y jobbra     x hatra    width jobbra   height hatra

        context.fillStyle = 'rgba(52,52,52,0.8)';

        if (this.isCrashed) {
            context.fillRect(-this.img.width / 2, -this.img.height / 2, this.img.width, this.img.height);
        }
        context.restore();
    }

    getNeighbours() {
        return {
            up: {x: this.getCenter().x, y: this.getCenter().y - 1},
            right: {x: this.getCenter().x + 1, y: this.getCenter().y},
            down: {x: this.getCenter().x, y: this.getCenter().y + 1},
            left: {x: this.getCenter().x - 1, y: this.getCenter().y},
        };

    }

    shoot() {
        return new Promise((resolve, reject) => {
            sounds.tank_fire.play().then(() => {
                updateFrame();
                console.log('shoot');
                let distance = 0;
                context.beginPath();
                context.strokeStyle = 'red';
                context.lineWidth = 1;
                context.moveTo(this.aimParams.startX, this.aimParams.startY);
                context.stroke();

                let destX;
                let destY;
                let objectAtPoint;

                let shootInterval = setInterval(() => {
                    distance += 1;

                    console.log('shoot interval');

                    destX = this.shootFunction(distance).x;
                    destY = this.shootFunction(distance).y;

                    context.lineTo(destX, destY);
                    context.stroke();

                    objectAtPoint = objectAt(destX, destY);

                    if (!objectAtPoint) {
                    } else if (objectAtPoint === 'wall') {
                        clearInterval(shootInterval);
                        setTimeout(() => {
                            updateFrame();
                            resolve();
                        }, 1000);
                    } else if (objectAtPoint instanceof Tank) {
                        if (objectAtPoint !== this) {
                            objectAtPoint.getDamage(this.damage);
                            clearInterval(shootInterval);
                            setTimeout(() => {
                                updateFrame();
                                resolve();
                            }, 1000);
                        }
                    } else if (objectAtPoint instanceof Fence) {
                        objectAtPoint.demolish(destX, destY);
                        clearInterval(shootInterval);
                        sounds['fence_bumm'].play();
                        drawExplosionAnimation(destX, destY, 45);
                        setTimeout(() => {
                            updateFrame();
                            setTimeout(() => {
                                resolve();
                            }, 2000);
                        }, 800);
                    }

                }, 5);
            });
        });
    }

    shootResult() {
        let destX;
        let destY;
        let distance = 0;
        while (true) {
            distance++;
            destX = this.shootFunction(distance).x;
            destY = this.shootFunction(distance).y;
            let objectAtPoint = objectAt(destX, destY);
            if (objectAtPoint !== undefined) {
                return objectAtPoint;
            }
        }
    }

}
