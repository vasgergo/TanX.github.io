export class Player {
    constructor(color) {
        this.color = color;
        this.tanks = [];
        this.tankIndex = -1;
    }

    addTank(tank) {
        this.tanks.push(tank);
    }

    nextTank() {
        this.tankIndex++;
        if (this.tankIndex >= this.tanks.length) {
            this.tankIndex = 0;
        }
        while(this.tanks[this.tankIndex].isCrashed){
            console.log('Ncrashed');
            this.tankIndex++;
            if (this.tankIndex >= this.tanks.length) {
                this.tankIndex = 0;
            }
        }
        return this.tanks[this.tankIndex];
    }

}