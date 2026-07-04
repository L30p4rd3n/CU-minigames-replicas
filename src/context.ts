import {inRange, randrange} from "./util/util";
import type {Mouse} from "./mouse"
import type {Button, Codebox} from "./buttons";

/* class affectedBodyParams {
    /// Body parameters possibly affected by (or affecting) the minigame
    pain: number;
    bleedAmount: number;
    skinHealth: number;
    muscleHealth: number;
} */

const logs = document.getElementById("logs")!;
logs.style = 'font-family: "Retro Gaming";src: url("./assets/font/RetroGaming.ttf");text-rendering: optimizeSpeed; color: white';


const dashFill = (numstr: string): string => {
    let outstr = "";
    if(numstr.length == 0){
        return "";
    }outstr = numstr[0];
    for(let i = 1; i < numstr.length; i++){
        outstr += Number(numstr[i]) ? -1 * (Number(numstr[i])) : "-0";
    }return outstr;
}

class Ctx{
    stored_code: string;
    entered_code: string = "";
    buttons: Button[];
    codeboxes: Codebox[];

    clear_ctx(){
        logs.innerHTML = "";
        this.entered_code = "";
        this.codeboxes[1].stored_code = "";
    }

    reset(isRegenNeeded: boolean){
        if(isRegenNeeded){
            this.generate_code();
        }this.clear_ctx();
    }

    generate_code(){
        let num = randrange(6, 13);
        let code = "";
        for(let i = 0; i < num; ++i){
            code += (randrange(1, 10));
        }this.stored_code = code;

        this.codeboxes[0].stored_code = dashFill(this.stored_code);
    }

    check_click(mouse: Mouse){
        if(mouse.clicked){
            return; 
        }mouse.captured_output = -3;
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
                if(this.entered_code.length >= 13){
                    return;
                }
                this.entered_code += mouse.captured_output;
                this.codeboxes[1].stored_code = dashFill(this.entered_code);
                this.checkMegalovania();
                if(this.checkWinCondition()){
                    this.endMinigame(false);
                }
            }
        }
    }

    checkWinCondition(): boolean{
        return this.entered_code == this.stored_code;
    }

    checkMegalovania(){
        if((this.entered_code.includes("2296")) && !(this.stored_code.includes("2296"))){
            this.endMinigame(true);
        }return;
    }

    endMinigame(fail: boolean): void{
        if(fail){
            logs.innerHTML = `
                <p>Minigame ended.</p>
                <p>The code remains the same.</p>
                <p>An Explosion has occured</p>
                <p>with following variables:</p>
                <p>${Math.random() > 0.9 ? Math.random() * 2 : 0} bleed amount</p>
                <p>${Math.random() > 0.5 ? Math.random() * (10-7) + 7 : 0} skin damage</p>
                <p>${Math.random() * (10-8) + 8} muscle damage</p>
            `;
            this.codeboxes[1].stored_code = "";
            this.entered_code = "";
        }else{
            logs.innerHTML = `
                <p>Minigame ended.</p>
                <p>Success!</p>
                <p>The code can be re-generated with a button press.</p>
            `;
        }
    }   
}

export {Ctx};
