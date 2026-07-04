import {Ctx} from "./context";
import {Button} from "./buttons";
import {Mouse} from "./mouse";

const canvas = document.getElementById("main-canvas")! as HTMLCanvasElement;
const HEIGHT = 400;
const WIDTH = 400;
const SCALE = 2;

const updateRate = 60;
const DeltaTime = 1/60; // s


canvas.width = WIDTH*SCALE;
canvas.height = HEIGHT*SCALE;

const loadImage = (path: string): Promise<HTMLImageElement> => {
    const image = new Image();
    image.src = path;
    return new Promise(r => {image.onload = () => r(image)});
};

const ctx = canvas.getContext("2d")!;
const mouse: Mouse = {x: 0, y: 0, captured_output: 0, clicked: false};
const keypad = new Ctx();

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

keypad.buttons = buttonbuttons;
const keypadImage = await loadImage("../assets/keypad.png");

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
    ctx.fillText(keypad.stored_code, 100 * SCALE, 100 * SCALE);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = '42px Retro Gaming';
    ctx.fillText(keypad.entered_code, 100 * SCALE, 150 * SCALE);

    requestAnimationFrame(draw_base);
}

draw_base();