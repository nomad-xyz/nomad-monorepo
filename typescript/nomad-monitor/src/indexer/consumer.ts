import { NomadEvent } from "./event";

export abstract class Consumer {
    abstract consume(event: NomadEvent): void;
}

export class Logger extends Consumer {
    consume(event: NomadEvent): void {
        console.log(event);
    }
}