import {inRange, randrange} from "./util/util";
import type {Mouse} from "./mouse"
import type {Button, Codebox} from "./buttons";

/* class affectedBodyParams {
    /// Body parameters possible affected by (or affecting) the minigame
    pain: number;
    bleedAmount: number;
    skinHealth: number;
    muscleHealth: number;
} */

const dashFill = (numstr: string): string => {
    let outstr = "";
    if(numstr.length == 0){
        return "";
    }outstr = numstr[0];
    for(let i = 1; i < numstr.length; i++){
        outstr += -1 * (Number(numstr[i]));
    }return outstr;
}

class Ctx{
    stored_code: string;
    entered_code: string = "";
    buttons: Button[];
    codeboxes: Codebox[];

    clear_ctx(){
        this.entered_code = "";
    }

    reset(isRegenNeeded: boolean){
        if(isRegenNeeded){
            this.generate_code();
        }this.clear_ctx();
    }

    generate_code(){ // onclick + condition
        let num = randrange(6, 13);
        let code = "";
        for(let i = 0; i < num; ++i){
            code += (randrange(1, 10));
        }this.stored_code = code;

        this.codeboxes[0].stored_code = dashFill(this.stored_code);
    }

    check_click(mouse: Mouse){ // onclick event
        if(mouse.clicked){
            return; 
        }mouse.captured_output = -3; // NULL
        for(let i = 0; i < this.buttons.length; i++){
            if(inRange(mouse.x, this.buttons[i].x, this.buttons[i].x + this.buttons[i].width) 
            && inRange(mouse.y, this.buttons[i].y, this.buttons[i].y + this.buttons[i].height)){
                mouse.captured_output = this.buttons[i].output;
                break;
            }
        }
        mouse.clicked = true;
        this.handle_click(mouse);
    }

    handle_click(mouse: Mouse){
        /// handVelocity could be changed here.

        if(mouse.captured_output != -3){
            if(!(inRange(mouse.captured_output, 0, 9))){
                this.reset(mouse.captured_output == -1); /// this will work for both the in-game reset button and the added-in re-generate button
            }else{
                this.entered_code += mouse.captured_output;
                this.codeboxes[1].stored_code = dashFill(this.stored_code);
                this.checkMegalovania();
                if(this.checkWinCondition()){
                    // this.endMinigame(fail=false);
                }
            }
        }
    }

    checkWinCondition(): boolean{
        return this.entered_code == this.stored_code;
    }

    checkMegalovania(){
        if((this.entered_code.includes("2296")) && !(this.stored_code.includes("2296"))){
            // this.endMinigame(fail=true);
        }return;
    }

    /* endMinigame(fail: bool){
        this.buttons = {...} // only re-generate button spanning the entire screen
        // changes to right part of the screen, where the stats are shown.
    }   
    */
   
}

export {Ctx};
