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

class RectTransform {
    x: number;
    y: number;

    anchoredX: number;
    anchoredY: number;
    angle: null | number;

    width: number;
    height: number;

    getRect = () => {
        return {lu: {x: this.x - this.width / 2, y: this.y - this.height / 2}, 
                ru: {x: this.x + this.width / 2, y: this.y - this.height / 2},
                ld: {x: this.x - this.width / 2, y: this.y + this.height / 2},
                rd: {x: this.x + this.width / 2, y: this.y + this.height / 2}};
    }
    anchoredPosition = (): Vector2 => {
        return {x: this.anchoredX, y:this.anchoredY};
    }

    overlap(other: RectTransform){
        let box1 = this.getRect();
        let box2 = other.getRect();

        if()
    }
}

export type {Button, Codebox, ActiveComponent, RectTransform}