import { Hand, HandSpriteType } from "../hand/handClass"
import type { ActiveComponent, RectTransform } from "../buttons";
import { randrange, randrangefloat } from "../util/util";
import type { Mouse } from "../mouse";

class ShrapnelMinigame {

    attachedMouse: Mouse
    attachedHand: Hand

    limb: string; // alt - Limb
    hasTweezers: boolean = false; // NOTE: true if tweezers are used on a limb, NOT when just pressing with tweezers in inventory

    shrapnelAmount: number = 0; // 0 ~ 5
    objects: Array<ActiveComponent>;

    trackPain: number // for hand shaking
    
    trackSkinHealth: number
    trackBleedAmount: number

    isLimbAHead: boolean // :braindamage:
    trackBrainHealth: number

    currentlyHeld: RectTransform | null // ????

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
    isShrapnelOut(shrapnelPiece: ActiveComponent){
        return shrapnelPiece.cy >= 35; // @object.anchoredPosition.y < 35f for shrapnel++.
    }

    initState(hasTweezers: boolean, limb: string, shrapnelAmount: number, attachAMouse: Mouse){
        this.attachedMouse = attachAMouse;

        let x = attachAMouse.x;
        let y = attachAMouse.y;
        this.attachedHand = new Hand(HandSpriteType.Grasp, {x, y});

        this.hasTweezers = hasTweezers;
        this.limb = limb;
        this.isHead();

        for(let i = 0; i < 5; i++){
            this.objects[i].cx = 0; // TODO: change to RectTransform
            this.objects[i].cy = 0;
        }
        let num: number = 5 - shrapnelAmount;
        this.objects.forEach(element => {
            const radius = Math.sqrt(Math.random()) * 20; // TODO: check if number is too big
            const angle = Math.random() * 2 * Math.PI;
            element.cx += Math.cos(angle) * radius;
            element.cy += Math.sin(angle) * radius;

            if(num > 0){
                num--;
                element.cy += 8000; // HUH???
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
            
        }
    }
    endMinigame(endCode: number){
        //-1 is NotStarted
    }
}

export { ShrapnelMinigame }