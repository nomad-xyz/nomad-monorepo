import { NomadEvent } from "./event";

export abstract class Consumer {
    abstract consume(event: NomadEvent): void;
}

export class Logger extends Consumer {
    i: number;

    constructor() {
        super();
        this.i = 0;
    }

    consume(event: NomadEvent): void {
        console.log(this.i ++, '---->', event);
    }
}