export class Timer extends EventTarget {
    constructor(roundTime) {
        super();
        this.roundTime = roundTime;
        this.time = roundTime;
    }

    start() {
        this.time = this.roundTime;
        this.interval = setInterval(() => {
            this.decrementTime();
        }, 100);
    }

    getTime() {
        return this.time.toFixed(1);
    }

    decrementTime() {
        this.time = parseFloat((this.time - 0.1).toFixed(1));
        this.emitChangeTimeEvent();
        if (this.time <= 0) {
            this.stop();
            this.emitTimeUpEvent();
        }
    }

    stop() {
        clearInterval(this.interval);
    }

    emitChangeTimeEvent() {
        let event = new CustomEvent('onChange', {asd:"asd"});
        this.dispatchEvent(event);
    }

    emitTimeUpEvent() {
        let event = new Event('OnTimeUp');
        this.dispatchEvent(event);
    }
}