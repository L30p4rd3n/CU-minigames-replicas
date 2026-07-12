import type { Mouse } from "../mouse";
import { Clamp01, ClampMagnitude, VectorLerp, type Vector2 } from "../util/maths";

enum HandSpriteType{ // not particularly required everywhere
    Grasp,
    Tweezers,
    Point,
    PointClick,
    GraspClick
    // some others that i won't need now
}

class Hand{
    handType: HandSpriteType;
    handVelocityX: number = 0;
    handVelocityY: number = 0;
    handRotation: number = 0;

    handPos: Vector2;

    x: number;
    y: number;

    constructor(handType: HandSpriteType, handPos: Vector2){
        this.handPos = handPos;
        this.x = handPos.x;
        this.y = handPos.y;

        this.handType = handType;
    }

    // yeah no, we're not implementing perlin noise for TS today :D
    getMousePos(mouse: Mouse, pain: number, res: number){
        return {x: mouse.x + (Math.random() - 0.5) * pain * Clamp01(1 - (res-10) * 0.06), y: mouse.y + (Math.random() - 0.5) * pain * Clamp01(1 - (res-10) * 0.06)};
        // NOTE: values can and probably should be changed...
    }

    // NOTE: consciousness is assumed to be 100.
    updateHandPhysics(mouse: Mouse, pain: number, res: number, str: number){
        let mousePos: Vector2 = this.getMousePos(mouse, pain, res);
        // PHYSICS_UPDATE_RATE might be moved to constants.ts
        if(Math.abs(mousePos.x) > 524){
            mousePos.x = 524 * Math.sign(mousePos.x);
        }if(Math.abs(mousePos.y) > 524){
            mousePos.y = 524 * Math.sign(mousePos.y);
        }
        let maxLength = 75;
        let num2 = 0.25;
        let num3 = 4 + (str - 10) * 0.3;
        let num4 = 1.5;

        let b: Vector2 = ClampMagnitude({x: (mousePos.x - this.x) * num2, y: (mousePos.y - this.y) * num2}, maxLength);
        let handVelocity = {x: this.handVelocityX, y: this.handVelocityY};
        handVelocity = VectorLerp(handVelocity, b, num3/60);
        handVelocity = VectorLerp(handVelocity, {x: 0, y: 0}, num4/60);
    
        this.handVelocityX = handVelocity.x;
        this.handVelocityY = handVelocity.y;
        console.log(handVelocity);
        this.x += handVelocity.x * 2 * 2.4;
        this.y += handVelocity.y * 2 * 2.4;
    };
}
export {Hand, HandSpriteType};

