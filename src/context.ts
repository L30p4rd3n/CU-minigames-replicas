import {inRange, randrange} from "./util/util";
import {Mouse} from "./mouse"
import {Button} from "./buttons";

class Ctx{
    stored_code: string; // no number manipulations :(
    entered_code: string;
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
    update_out(output: number){
        if(this.entered_code == ""){
            this.entered_code += output;
        }else{
            this.entered_code += (output * -1); // -{number}
        }
    }

    handle_click(mouse: Mouse){
        if(mouse.captured_output != -3){
            if(!(inRange(mouse.captured_output, 0, 9))){
                this.reset(mouse.captured_output == -1);
            }else{
                this.update_out(mouse.captured_output);
            }
        }
    }

    checkWinCondition(): boolean{
        return this.entered_code == this.stored_code;
    }
   
}

class codebox{
    x: number;
    y: number;

    height: number;
    width: number;
    inner_code: string;    
}

export {Ctx, codebox};
