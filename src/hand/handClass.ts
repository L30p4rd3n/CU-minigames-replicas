import type { Mouse } from "../mouse";
import { Clamp01, type Vector2 } from "../util/maths";

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

    anchoredX: number;
    anchoredY: number;
    constructor(handType: HandSpriteType, handPos: Vector2){
        this.handPos = handPos;
        this.anchoredX = 0;
        this.anchoredY = 0;

        this.x = handPos.x;
        this.y = handPos.y;

        this.handType = handType;
    }

    // yeah no, we're not implementing perlin noise for TS today :D
    getMousePos(mouse: Mouse, pain: number, res: number){
        return {x: mouse.x + (Math.random() - 0.5) * pain * Clamp01(1 - (res-10) * 0.06), y: mouse.y + (Math.random() - 0.5) * pain * Clamp01(1 - (res-10) * 0.06)};
        // NOTE: values can and probably should be changed...
    }
}

export {Hand, HandSpriteType};

