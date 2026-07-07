import {Ctx} from "./context";
import type { Mouse } from "./mouse";
import { loadImage } from "./util/util";

import "./style.css"
import type { Button, Codebox } from "./buttons";

const canvas = document.getElementById("main-canvas")! as HTMLCanvasElement;
const SCALE = 1;

// const updateRate = 60;
// const DeltaTime = 1/updateRate;

const buttonbuttons = [
    {
        x: 127,
        y: 558,
        width: 118,
        height: 118,
        output: 1
    },
    {
        x: 270,
        y: 558,
        width: 118, 
        height: 118,
        output: 2
    },
    {
        x: 412,
        y: 558,
        width: 118, 
        height: 118,
        output: 3
    },
    {
        x: 554,
        y: 558,
        width: 118, 
        height: 118,
        output: 4
    },
    {
        x: 697,
        y: 558,
        width: 118, 
        height: 118,
        output: 5
    },{
        x: 127,
        y: 699,
        width: 118,
        height: 118,
        output: 6
    },
    {
        x: 270,
        y: 699,
        width: 118, 
        height: 118,
        output: 7
    },
    {
        x: 412,
        y: 699,
        width: 118, 
        height: 118,
        output: 8
    },
    {
        x: 554,
        y: 699,
        width: 118, 
        height: 118,
        output: 9
    },
    {
        x: 697,
        y: 699,
        width: 118, 
        height: 118,
        output: 0
    },
    {
        x: 845,
        y: 391,
        width: 94,
        height: 94,
        output: -2
    }
    
]

const codeboxes = [
    {
        x: 127,
        y: 66,
        width: 688,
        height: 82,
        stored_code: ""
    },
    {
        x: 127,
        y: 371,
        width: 688,
        height: 134,
        stored_code: ""
    }
]

const ctx = canvas.getContext("2d")!;
const mouse: Mouse = {x: 0, y: 0, captured_output: 0, clicked: false};
const keypad = new Ctx();
keypad.buttons = buttonbuttons;
keypad.codeboxes = codeboxes;
keypad.generate_code();
canvas.width = 942;
canvas.height = 843;

function getMousePos(e: MouseEvent){
    let rect = canvas.getBoundingClientRect();
    return {
        x: (e.clientX - rect.left) * (canvas.width / rect.width),
        y: (e.clientY - rect.top) * (canvas.height / rect.height)
    }
}

canvas.addEventListener("mousemove", (e: MouseEvent) =>{
    let pos = getMousePos(e);
    mouse.x = pos.x;
    mouse.y = pos.y;
});

canvas.addEventListener("mousedown", () => {
    keypad.check_click(mouse);
});

canvas.addEventListener("mouseup", () => {
    mouse.clicked = false;
    mouse.captured_output = -3;
})

const renderBox = (src: Button | Codebox) => {
    ctx.globalAlpha = 0.8; // TODO - determine actual in-game alpha
    ctx.fillStyle = "#FFF";
    ctx.fillRect(src.x - 3*SCALE, src.y - 3*SCALE, src.width + 6*SCALE, src.height + 6*SCALE);
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#000";
    ctx.fillRect(src.x, src.y, src.width, src.height);
    if("output" in src){
        ctx.textAlign = 'center';
        ctx.font = '64px Retro Gaming';
        ctx.fillStyle = "#FFF";
        ctx.fillText(src.output == -2 ? "C" : src.output.toString(), src.x + src.width / 2 * SCALE, src.y + (src.height + 48) / 2 * SCALE);
    }
}


const draw_base = () => {
    ctx.fillStyle = "#FFF";
    ctx.font = "22px Retro Gaming";
    ctx.textAlign = 'center';
    ctx.fillText("Match the code to open.", canvas.width / 2, 32);

    for(let button = 0; button < buttonbuttons.length; button++){
        renderBox(buttonbuttons[button]);
    }for(let codebox = 0; codebox < codeboxes.length; codebox++){
        renderBox(codeboxes[codebox]);
    }
    ctx.fillStyle = "#FFF";
    ctx.font = '42px Retro Gaming';
    ctx.textAlign = 'center';
    ctx.fillText(keypad.codeboxes[0].stored_code, canvas.width / 2 * SCALE, (codeboxes[0].y + codeboxes[0].height / 2 + 16 * SCALE));

    ctx.fillStyle = "#FFF";
    ctx.font = '70px Retro Gaming';
    let wrap_flag: boolean = false;
    let piece1: string = "";
    let piece2: string = "";
    for(let i = 0; i < codeboxes[1].stored_code.length; i++){
        if(ctx.measureText(codeboxes[1].stored_code.slice(0, i+1)).width < 700 * SCALE){
            piece1 += codeboxes[1].stored_code[i];
        }else{
            wrap_flag = true;
            piece2 += codeboxes[1].stored_code[i];
        }
    }if(piece2.startsWith("-")){
        piece1 = codeboxes[1].stored_code.slice(0, piece1.lastIndexOf('-') + 1);
        piece2 = codeboxes[1].stored_code.slice(piece1.lastIndexOf('-') + 1);
    }
    if(wrap_flag){
        ctx.fillText(piece1, canvas.width / 2 * SCALE, (codeboxes[1].y + codeboxes[1].height / 2 - 8) * SCALE);
        ctx.fillText(piece2, canvas.width / 2 * SCALE, (codeboxes[1].y + codeboxes[1].height / 2 + 58) * SCALE);
    }else{
        ctx.fillText(piece1, canvas.width / 2 * SCALE, (codeboxes[1].y + codeboxes[1].height / 2 + 20) * SCALE);
    }
    
    requestAnimationFrame(draw_base);
}

draw_base();

document.getElementById("coderegen")!.addEventListener("click", () => {
    mouse.captured_output = -1;
    keypad.handle_click(mouse);
});