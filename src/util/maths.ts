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
    return {x: v.x / magnitude(v), y: v.y / magnitude(v)}; // me really mathing it rn
}
const vectorFromAngle = (angle: number) => {
    return {x: Math.sin(angle * (Math.PI / 180)), y: Math.cos(angle * (Math.PI / 180))};
}
const angleFromVector = (dir: Vector2) => {
    let num: number = Math.atan2(dir.x, dir.y) * 57.29578;
    if(num < 0){
        num += 360;
    }return num;
}

export type {Vector2}
export {coordsToVector, magnitude, normalised, vectorFromAngle, angleFromVector};
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
