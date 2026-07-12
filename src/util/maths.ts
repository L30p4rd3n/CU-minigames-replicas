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

const ClampMagnitude = (vector: Vector2, maxLength: number): Vector2 => {
    let num: number = magnitude(vector) * magnitude(vector);
    if(num > maxLength * maxLength){
        let num2: number = Math.sqrt(num);
        let num3: number = vector.x / num2;
        let num4: number = vector.y / num2;

        return {x: num3 * maxLength, y: num4 * maxLength};
    }
    return vector;
}

const VectorLerp = (a: Vector2, b: Vector2, t: number): Vector2 => {
    t = Clamp01(t);
    return {x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t};
}

export type {Vector2}
export {coordsToVector, magnitude, normalised, vectorFromAngle, angleFromVector, ClampMagnitude, VectorLerp};
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
