import type { Hand } from "./hand/handClass";
import type { Mouse } from "./mouse";
import type { Vector2 } from "./util/maths";

interface Button{
    x: number;
    y: number; 
    width: number;
    height: number;
    output: number;
}

interface Codebox{
    x: number;
    y: number;
    width: number;
    height: number;
    stored_code: string;
}

interface ActiveComponent {
    cx: number;
    cy: number;
    angle: number;
}

class Rect {
    x: number;
    y: number;

    width: number;
    height: number;

    getRect = () => {
        return {lu: {x: this.x - this.width, y: this.y - this.height}, 
                ru: {x: this.x + this.width, y: this.y - this.height},
                ld: {x: this.x - this.width, y: this.y + this.height},
                rd: {x: this.x + this.width, y: this.y + this.height}};
    }
    calcOffset = (mouse: Mouse | Hand): Vector2 => {
        return {x: this.x - mouse.x, y: this.y - mouse.y};
    }

    constructor(x: number, y: number, width: number, height: number){
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
}

export { Rect }
export type {Button, Codebox, ActiveComponent}
