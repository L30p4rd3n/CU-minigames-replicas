/* Vector math */
interface Vector2{
    x: number;
    y: number;
}

const coordsToVector = (x1: number, x2: number, y1: number, y2: number) => {
    return {x: x2-x1, y: y2-y1};
}
const magnitude = (v: Vector2) => {
    return Math.sqrt(v.x*v.x + v.y*v.y)
}
const normalised = (v: Vector2) => { // yes, i was taught bri'ish english
    return {x: v.x / magnitude(v), y: v.y / magnitude(v)}; // me realy mathing it rn
}

export type {Vector2}
export {coordsToVector, magnitude, normalised}
/* Math math */
function Clamp01(num: number){
    if(num < 0){
        num = 0;
    }if(num > 1){
        num = 1;
    }return num;
}
function Clamp(num: number, lb : number, hb: number){
    if(num < lb){
        num = lb;
    }if(num > hb){
        num = hb;
    }return num;
}
function Lerp(a: number, b: number, t: number){ 
    return a + (b-a) * t;
}

export {Clamp, Clamp01, Lerp}

/* Coordinate math */
// NOTE: works only if initial (0,0) is in 2nd quarter of new (0,0) = (x0, y0)
// NOTE: the same {i,j} is used, without rotations
const relativeX = (absX: number, anchorX: number) => {
    return (anchorX - absX);
}
const relativeY = (absY: number, anchorY: number) => {
    return (absY - anchorY);
}


export {relativeX, relativeY}

