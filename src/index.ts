import {Ctx} from "./context";
import type { Mouse } from "./mouse";

import "./style.css"

const canvas = document.getElementById("main-canvas")! as HTMLCanvasElement;
const SCALE = 1;

// const updateRate = 60;
// const DeltaTime = 1/updateRate;


const loadImage = (path: string): Promise<HTMLImageElement> => {
    const image = new Image();
    image.src = path;
    return new Promise(r => {image.onload = () => r(image)});
};

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

const keypadImage = await loadImage("../assets/image/keypad.png");
canvas.width = keypadImage.width;
canvas.height = keypadImage.height;

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

const draw_base = () => {
    ctx.drawImage(keypadImage, 0, 0);

    ctx.fillStyle = "#FFF";
    ctx.font = '42px Retro Gaming';
    ctx.textAlign = 'center';
    ctx.fillText(keypad.codeboxes[0].stored_code, canvas.width / 2 * SCALE, (codeboxes[0].y + codeboxes[0].height / 2 + 16 * SCALE));

    ctx.fillStyle = "#FFF";
    ctx.font = '64px Retro Gaming';
    ctx.fillText(keypad.codeboxes[1].stored_code, canvas.width / 2 * SCALE, (codeboxes[1].y + codeboxes[1].height / 2 + 16) * SCALE);
    requestAnimationFrame(draw_base);
}

draw_base();

document.getElementById("coderegen")!.addEventListener("click", () => {
    mouse.captured_output = -1;
    keypad.handle_click(mouse);
});