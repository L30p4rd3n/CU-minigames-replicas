import { Hand, HandSpriteType } from "../hand/handClass"
import { Rect } from "../buttons";
import { inRange, randrange, randrangefloat } from "../util/util";
import type { Mouse } from "../mouse";
import { SCALE } from "../util/constants";
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

    isLimbAHead: boolean // :braindamage:
    trackBrainHealth: number = 100;

    currentlyHeld: Rect | null

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
        return (shrapnelPiece.y + shrapnelPiece.width / 2) >= 35; // @object.anchoredPosition.y < 35f for shrapnel++.
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
            const radius = Math.sqrt(Math.random() * 40) ; // TODO: check if number is too big
            const angle = Math.random() * 2 * Math.PI;
            element.x += Math.cos(angle) * radius;
            element.y += Math.sin(angle) * radius;
            if(num > 0){
                num--;
                element.y += 8000;
            }
        });

        // do something with the hand/
    }

    BreakGrasp(){ // add in hand track
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
        if(this.hasTweezers && this.shrapnelAmount == 0){
            this.endMinigame(-1);
        }if(this.attachedMouse.clicked){ // TODO: add justClicked to mouse plspls
            for(let element = 0; element < 5; element++){
                let rect = this.objects[element].getRect();
                console.log(rect.lu.x, rect.ru.x, rect.lu.y, rect.ld.y, "mouse: ", this.attachedMouse.x, this.attachedMouse.y);
                if(inRange(this.attachedMouse.x, rect.lu.x, rect.ru.x) && inRange(this.attachedMouse.y, rect.lu.y, rect.ld.y)){
                    this.currentlyHeld = this.objects[element];
                    heldOffset = this.objects[element].MouseOffset(this.attachedMouse);
                    break;
                }
            };
        }//volume controls

        if(this.currentlyHeld != null){
            if(this.isShrapnelOut(this.currentlyHeld)){
                this.currentlyHeld.x = this.attachedHand.handPos.x + heldOffset.x;
                this.currentlyHeld.y = this.attachedHand.handPos.y + heldOffset.y;
            }else{
                // currentlyheld.x stays the same
                this.currentlyHeld.y = this.attachedHand.y + heldOffset.y;
                if(Math.abs(this.attachedHand.handVelocityY) > 2.2 && !this.hasTweezers){
                    this.BreakGrasp();
                    return;
                }if(Math.abs(this.currentlyHeld.x - this.attachedHand.handPos.x) > 42){
                    this.BreakGrasp();
                    return;
                }
            }if(this.currentlyHeld.y < -364){
                this.currentlyHeld.y = -364;
            }
        }

        let num: number = 0;
        this.objects.forEach(object => {
            if(!this.isShrapnelOut(object)){ // i think a TODO: y + height / 2...
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
    }
    endMinigame(endCode: number){
        switch(endCode){
            case -1:{
                console.log("the game was not started");
                break;
            }case 0:{
                console.log("success");
                break;
            }case 1:{
                console.log("something something fail idk");
                break;
            }
        }
    }
}

export { ShrapnelMinigame }