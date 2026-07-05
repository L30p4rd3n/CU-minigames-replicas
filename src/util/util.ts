import type { Vector2 } from "./maths"; 

function inRange(source: number, lowbound: number, highbound: number) : boolean{
    return (lowbound <= source) && (source <= highbound);
}

function randrange(a: number, b: number): number{ // a <= b
    return Math.floor(Math.random() * (Math.floor(b) - Math.floor(a)) + Math.floor(a));
}

function VectorToAngle(dir: Vector2){
    let num: number = Math.atan2(dir.x, dir.y) * 57.29578;
    if(num < 0){
        num += 360;
    }return num;
}

export {inRange, randrange, VectorToAngle};