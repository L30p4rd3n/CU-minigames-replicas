interface Vector2{
    x: number;
    y: number;
    add(other: Vector2): Vector2;
    // multiply(other: Vector2): Vector2; // scalar, not vector; can be used to find cos;
    multuply(lambda: number): Vector2;
    // {x, y}
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

export type {Vector2};
export {coordsToVector, magnitude, normalised};


