import { Hand, HandSpriteType } from "../hand/handClass"
import { Rect } from "../buttons";
import { inRange, randrange, randrangefloat } from "../util/util";
import type { Mouse } from "../mouse";
import { SCALE } from "../util/constants";
import { coordsToVector } from "../util/maths";
let heldOffset = {x: 0, y: 0};

function* yieldRect(amount: number){
    for(let i = 0; i < amount; i++)
        yield new Rect(0, 0, 0, 0);
}

class ShrapnelMinigame {

    attachedMouse: Mouse
    attachedHand: Hand

    limb: string; // alt - Limb
    hasTweezers: boolean = false; // NOTE: true if tweezers are used on a limb, NOT when just pressing with tweezers in inventory

    shrapnelAmount: number = 0; // 0 ~ 5
    objects: Array<Rect>;

    trackPain: number = 0; // for hand shaking
    
    trackSkinHealth: number = 100;
    trackBleedAmount: number = 0;

    isLimbAHead: boolean
    trackBrainHealth: number = 100;

    currentlyHeld: Rect | null

    beaten: boolean = false;

    HandType(){
        if(!this.hasTweezers){
            return HandSpriteType.Grasp;
        }return HandSpriteType.Tweezers;
    }

    isHead(){ // setter + getter, TODO: separate.
        if(this.limb == "Head" && !this.isLimbAHead){
            this.isLimbAHead = true;
        }return this.isLimbAHead;
    }
    isShrapnelOut(shrapnelPiece: Rect){
        return (shrapnelPiece.y) >= 35;
    }

    initState(hasTweezers: boolean, limb: string, shrapnelAmount: number, attachAMouse: Mouse){
        this.attachedMouse = attachAMouse;

        let x = attachAMouse.x;
        let y = attachAMouse.y;
        this.attachedHand = new Hand(HandSpriteType.Grasp, {x, y});

        this.hasTweezers = hasTweezers;
        this.limb = limb;
        this.isHead();

        this.objects = Array.from(yieldRect(5));

        let num: number = 5 - shrapnelAmount;
        this.objects.forEach(element => { // spread
            const radius = Math.sqrt(Math.random())* 20 ;
            const angle = Math.random() * 2 * Math.PI;
            element.x += Math.cos(angle) * radius * SCALE;
            element.y += -150 + Math.sin(angle) * radius;
            if(num > 0){
                num--;
                element.y += 8000;
            }
        });

        this.beaten = false;
    }

    BreakGrasp(){
        if(this.currentlyHeld){
            this.currentlyHeld = null;
            this.attachedMouse.clicked = false;
            this.attachedHand.handType = HandSpriteType.Grasp;
            this.trackSkinHealth -= randrangefloat(4, 6);
            this.trackBleedAmount += randrangefloat(0.4, 1);
            this.trackPain += randrange(9, 16);
            if(this.isLimbAHead && Math.random() < 0.8){
                this.trackBrainHealth -= Math.random();
            }
        }
    }

    Update(){ 
        // NOTE: there is a bug - if you start pulling out a piece, 
        // then move the mouse away from canvas(vertically), 
        // then put it back in, the y of an object is -400.
        // the bug is "fixed" with a band-aid solution of punishing the `player`.
        if(this.attachedMouse.clicked && this.currentlyHeld == null && this.attachedHand.y > -170){
            for(let element = 0; element < 5; element++){
                let rect = this.objects[element].getRect();
                if(inRange(this.attachedMouse.x, rect.lu.x, rect.ru.x) && inRange(this.attachedMouse.y, Math.min(rect.lu.y, rect.ld.y), Math.max(rect.lu.y, rect.ld.y))){
                    this.currentlyHeld = this.objects[element];
                    heldOffset = this.objects[element].calcOffset(this.attachedHand);
                    break;
                }
            };
        }//volume controls
        this.attachedHand.updateHandPhysics(this.attachedMouse, this.trackPain, 10, 10); // NOTE: also defaults
        if(this.currentlyHeld != null){
            if(this.isShrapnelOut(this.currentlyHeld)){
                this.currentlyHeld.x = this.attachedHand.x + heldOffset.x;
                this.currentlyHeld.y = this.attachedHand.y + heldOffset.y;
            }else{
                this.currentlyHeld.y = this.attachedHand.y + heldOffset.y;
                if(Math.abs(this.attachedHand.handVelocityY) > (2.2 / 2.4) && !this.hasTweezers){ // what the actual fuck.
                    this.BreakGrasp();
                    return;
                }
                // NOTE: changed from 42(fixed in-game size) to account for dimensions
                if(Math.abs(this.currentlyHeld.x - this.attachedHand.x) > Math.abs(this.currentlyHeld.getRect().lu.x - this.currentlyHeld.getRect().ru.x) / 2){ 
                    this.BreakGrasp();
                    return;
                }
            }if(this.currentlyHeld.getRect().lu.y < -364){ 
                this.currentlyHeld.y = -364 + this.currentlyHeld.height;
            }
        }

        let num: number = 0;
        this.objects.forEach(object => {
            if(!this.isShrapnelOut(object)){
                num++;
            }
        });
        this.shrapnelAmount = num;
        if(num == 0){
            this.endMinigame(0);
        }
        if(!this.attachedMouse.clicked){
            this.currentlyHeld = null;
        }

        // this will still increase pain, probably because the hand position shifts instantly...
        this.objects.forEach(element => {
            if(element.getRect().lu.y < -364){
                element.y = -364 + element.height;
            }
        })

    }
    endMinigame(endCode: number){
        switch(endCode){
            case 0:{
                this.beaten = true;
                break;
            }case 1:{
                // too much pain or something, TODO: change accordingly.
                break;
            }
        }
    }
}

export { ShrapnelMinigame }