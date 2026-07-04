import {Ctx} from "./context";
// import type { Button } from "./buttons";
import type { Mouse } from "./mouse";

import "./style.css"

const canvas = document.getElementById("main-canvas")! as HTMLCanvasElement;
const SCALE = 2;

// const updateRate = 60;
// const DeltaTime = 1/updateRate;


const loadImage = (path: string): Promise<HTMLImageElement> => {
    const image = new Image();
    image.src = path;
    return new Promise(r => {image.onload = () => r(image)});
};

const buttonbuttons = [
    {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        output: 1
    },
    {
        x: 150,
        y: 0,
        width: 100, 
        height: 100,
        output: 2
    }
]

const codeboxes = [
    {
        x: 0,
        y: 0,
        width: 200,
        height: 200,
        stored_code: ""
    },
    {
        x: 0,
        y: 200,
        width: 200,
        height: 200,
        stored_code: ""
    }
]

const ctx = canvas.getContext("2d")!;
const mouse: Mouse = {x: 0, y: 0, captured_output: 0, clicked: false};
const keypad = new Ctx();
keypad.buttons = buttonbuttons;
keypad.codeboxes = codeboxes;
keypad.generate_code();

const keypadImage = await loadImage("../assets/keypad.png");
canvas.width = keypadImage.width;
canvas.height = keypadImage.height;

canvas.addEventListener("mousemove", (e: MouseEvent) =>{
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    console.log(mouse.x, mouse.y);
});

canvas.addEventListener("mousedown", () => {
    keypad.check_click(mouse);
    console.log("mouse down");
    console.log(keypad.entered_code);
});

canvas.addEventListener("mouseup", () => {
    mouse.clicked = false;
    mouse.captured_output = -3;
    console.log("mouse up");
})

const draw_base = () => {
    ctx.drawImage(keypadImage, 0, 0);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = '42px Retro Gaming';
    ctx.fillText(keypad.codeboxes[0].stored_code, 100 * SCALE, 100 * SCALE);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = '42px Retro Gaming';
    ctx.fillText(keypad.codeboxes[1].stored_code, 100 * SCALE, 150 * SCALE);

    requestAnimationFrame(draw_base);
}

draw_base();