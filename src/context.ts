import {inRange, randrange} from "./util/util";
import type {Mouse} from "./mouse"
import type {Button} from "./buttons";

/* class affectedBodyParams {
    /// Body parameters possible affected by (or affecting) the minigame
    pain: number;
    bleedAmount: number;
    skinHealth: number;
    muscleHealth: number;
} */

class Ctx{
    stored_code: string; // no number manipulations :(
    entered_code: string = "";
    buttons: Button[];

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
    AddDashes(output: number){
        if(this.entered_code == ""){
            this.entered_code = output.toString();
        }else{
            this.entered_code += (output * -1).toString();
        }
    }

    handle_click(mouse: Mouse){
        /// handVelocity should be changed here.
        if(mouse.captured_output != -3){
            if(!(inRange(mouse.captured_output, 0, 9))){
                /// this will work for both the in-game reset button and the added-in re-generate button
                this.reset(mouse.captured_output == -1);
            }else{
                this.AddDashes(mouse.captured_output);
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
