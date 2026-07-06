import type { ActiveComponent } from "./buttons";
import type { Mouse } from "./mouse";
import { Clamp, coordsToVector, Clamp01, magnitude, relativeX, relativeY } from "./util/maths";
import { inRange, moveTowards, randrange, VectorToAngle } from "./util/util";

const findCenter = (c: ActiveComponent) => {
    return {x: c.x + c.width / 2, y: c.y + c.height / 2}
}

const handAngle = (mouse: Mouse, lockRect: ActiveComponent) => {
    return VectorToAngle(coordsToVector(findCenter(lockRect).x, relativeX(mouse.x, findCenter(lockRect).x), 
    findCenter(lockRect).y, relativeY(mouse.y, findCenter(lockRect).y)));
}

class Lock{
    pickLevel: number;

    anglePrecision: number;
    correctAngle: number;

    lockProgress: number;
    lockRect: ActiveComponent;
    timeWasStuck: number;

    innerText: string;

    initState(lockRect: ActiveComponent){ // ъуъ
        this.lockRect = lockRect;
        this.correctAngle = randrange(5, 175);
        // sounds[2]
        this.innerText = `something something degrees`;
        // bool check for INT and lockpick sprites
        this.pickLevel = -1;
    }
    clicking_inside(mouse: Mouse){
        return handAngle(mouse, this.lockRect) > 0 && handAngle(mouse, this.lockRect) < 180 && inRange(magnitude({x: mouse.x, y: mouse.y}), 195, 247); // might be relative...
    }

    MaxTurnProgress(mouse: Mouse){
        let num: number = Math.abs(handAngle(mouse, this.lockRect) - this.correctAngle);
        if(num < this.anglePrecision){
            num = 0;
        }return Clamp01(1 - num / 90);
    }
     
    handle_click(mouse: Mouse, delta: number){
        let num = this.pickLevel + 1;

        let num2 = 0;
        if(mouse.clicked && this.clicking_inside(mouse)){
            // pickSound.volume = MoveTowards(volume, 1, delta*5)
            this.lockProgress += delta * (0.66 + num * 0.065);
            if(this.lockProgress >= this.MaxTurnProgress(mouse)){
                this.lockProgress = this.MaxTurnProgress(mouse);
                if(this.lockProgress == 1){
                    // unlock sound
                    // end minigame (thinking of putting like a plushie img)
                }else{
                    // break sound
                    /// * lockRect.anchoredPosition = Random.insideUnitCircle * 10f * timeWasStuck; - cs
                    num2 = randrange(-10, 10) * this.timeWasStuck;
                    this.timeWasStuck += delta;
                    this.anglePrecision += delta * 0.03;
                    // something something code formatting, stored precision etc... this is for ActiveComponent part
                    if(this.timeWasStuck > 0.5){
                        if(this.pickLevel < 0){
                            // pain (camera)
                            // claw health (debug)
                        }else{
                            // lockpick state (debug + camera)
                        }
                    }this.timeWasStuck = 0;
                    // breakSound.stop()
                }
            }
        }else{
            this.lockProgress = moveTowards(this.lockProgress, 0, delta*Clamp(2-num*0.4, 0.1, 2))
        }

        this.lockRect.angle = (0 - this.lockProgress) * 180 + num2;
        if(mouse.clicked == false){
            this.timeWasStuck = 0;
            /// clicking_inside is not really a property is it
            /// breakSound.stop()
        }
    }
    
}

export { Lock, findCenter, handAngle };