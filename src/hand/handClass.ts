import type { Vector2 } from "../util/maths";

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
    handVelocity: number = 0;
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
}

export {Hand, HandSpriteType};

