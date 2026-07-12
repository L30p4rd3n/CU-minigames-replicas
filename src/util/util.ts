import type { Vector2 } from "./maths"; 

function inRange(source: number, lowbound: number, highbound: number) : boolean{
    return (lowbound <= source) && (source <= highbound);
}

function randrange(a: number, b: number): number{ // a <= b
    return Math.floor(Math.random() * (Math.floor(b) - Math.floor(a)) + Math.floor(a));
}
function randrangefloat(a: number, b: number): number{
    return Math.random() * (Math.floor(b) - Math.floor(a)) + Math.floor(a);
}

function VectorToAngle(dir: Vector2){
    let num: number = Math.atan2(dir.x, dir.y) * 57.29578;
    if(num < 0){
        num += 360;
    }
    return num;
}

function moveTowards(current: number, target: number, maxDelta: number){
    if (Math.abs(target - current) <= maxDelta){
        return target;
    }return current + Math.sign(target - current) * maxDelta;
}

const quickfire = (path: string): void => {
    const sound = new Audio(path)
    sound.play();
}
const loadImage = (path: string): Promise<HTMLImageElement> => {
    const image = new Image();
    image.src = path;
    return new Promise(r => {image.onload = () => r(image)});
};

export {inRange, randrange, randrangefloat, VectorToAngle, moveTowards, quickfire, loadImage};