import type { ActiveComponent } from "./buttons";
import type { Mouse } from "./mouse";
import { Clamp, Clamp01, magnitude } from "./util/maths";
import { inRange, moveTowards, randrange, VectorToAngle } from "./util/util";
import { SCALE } from './util/constants.ts';

const handAngle = (dx: number, dy: number) => {
    return VectorToAngle({x: -1 * dx, y: dy}) - 90;
}

const containers = [1, 2.5, 8]; // container, medical, lifepod

class Lock{
    pickLevel: number;

    anglePrecision: number;
    correctAngle: number;

    lockProgress: number;
    lockRect: ActiveComponent;
    timeWasStuck: number;

    justClickedX: number;
    justClickedY: number;

    innerText: string;

    trackPain: number;
    trackClawHealth: number;
    trackLockpick: number;

    initState(lockRect: ActiveComponent, useLockpick: boolean, int: number, containerType: number){ // ъуъ
        this.lockRect = lockRect;
        this.correctAngle = randrange(5, 175);
        this.anglePrecision = containers[containerType];
        this.lockProgress = 0;
        this.timeWasStuck = 0;
        // sounds[2]
        this.innerText = `Lock precision: ${this.anglePrecision.toFixed(1)} degree${this.anglePrecision > 1.0 ? "s" : ""}`;
        if(useLockpick && int > 10){
            this.pickLevel = int - 10;
        }else{
            this.pickLevel = -1;
        }
        

        // NOTE - if you /really/ need to change that, just make callback funcitons changing those values.
        this.trackClawHealth = 100;
        this.trackPain = 0; 
        this.trackLockpick = 1;

    }
    clicking_inside(){
        return handAngle(this.justClickedX, this.justClickedY) > 0 
               && handAngle(this.justClickedX, this.justClickedY) < 180 
               && inRange(magnitude({x: this.justClickedX, y: this.justClickedY}), 195 * SCALE / 2, 247 * SCALE / 2);
    }

    MaxTurnProgress(){
        let num: number = Math.abs(handAngle(this.justClickedX, this.justClickedY) - this.correctAngle);
        if(num < this.anglePrecision){
            num = 0;
        }return Clamp01(1 - num / 90);
    }
     
    handle_click(mouse: Mouse, delta: number){
        let num = this.pickLevel + 1;
        let num2 = 0;
        if(mouse.clicked && this.clicking_inside()){
            // pickSound.volume = MoveTowards(volume, 1, delta*5)
            this.lockProgress += delta * (0.66 + num * 0.065);
            if(this.lockProgress >= this.MaxTurnProgress()){
                this.lockProgress = this.MaxTurnProgress();
                if(this.lockProgress == 1){
                    // unlock sound
                    this.endMinigame(false);
                }else{
                    // break sound
                    /// * lockRect.anchoredPosition = Random.insideUnitCircle * 10f * timeWasStuck; - cs
                    num2 = randrange(-10, 10) * this.timeWasStuck;
                    this.timeWasStuck += delta;
                    this.anglePrecision += delta * 0.03;
                    // need a link to the image here, it should randomly jitter in its (x,y) not (\alpha)
                    if(this.timeWasStuck > 0.5){
                        if(this.pickLevel < 0){
                            this.trackPain += 20;
                            this.trackClawHealth -= 15;
                            if(this.trackPain > 105){ // this is when you're most likely unconscious
                                this.endMinigame(true);
                            }
                        }else{
                            if(this.trackLockpick > 0){
                                this.trackLockpick -= 0.03;
                            }else{
                                this.endMinigame(true);
                            }
                        }this.timeWasStuck = 0;
                    }
                    // breakSound.stop()
                }
            }
        }else{
            this.lockProgress = moveTowards(this.lockProgress, 0, delta*Clamp(2-num*0.4, 0.1, 2))
        }
        this.innerText = `Lock precision: ${this.anglePrecision.toFixed(1)} degree${Number(this.anglePrecision.toFixed(1)) >= 1.1 ? "s" : ""}`;
        this.lockRect.angle = (0 - this.lockProgress) * 180 / 57.29578; // sanest radian enjoyer
        if(mouse.clicked == false){
            this.timeWasStuck = 0;
            /// breakSound.stop()
        }
    }

    endMinigame(fail: boolean){
        if(fail){
            // something something too much pain or lockpicking kit broke...
        }else{
            // pass some call to render...
        }
    }
    
}

export { Lock, handAngle };