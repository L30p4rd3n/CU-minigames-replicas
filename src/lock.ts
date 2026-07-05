import type { Mouse } from "./mouse";
import { Clamp, coordsToVector, Clamp01, Lerp, magnitude } from "./util/maths";
import { inRange, VectorToAngle } from "./util/util";

const handAngle = (mouse: Mouse) => { // NOT a correct repr.
    return VectorToAngle(coordsToVector(0, mouse.x, 0, mouse.y));
}

class Lock{
    pickLevel: number;

    anglePrecision: number;
    correctAngle: number;

    lockProgress: number;

    MaxTurnProgress(mouse: Mouse){
        let num: number = Math.abs(VectorToAngle(coordsToVector(0, mouse.x, 0, mouse.y))); // x1, y1 = {component.x, component.y}, anchor etc...
        if(num < this.anglePrecision){
            num = 0;
        }return Clamp01(1 - num / 90);
    }

    clicking_inside(mouse: Mouse){
        return handAngle(mouse) > 0 && handAngle(mouse) < 180 && inRange(magnitude({x: mouse.x, y: mouse.y}), 195, 247); // might be relative...
    } 

    
}

export { Lock };