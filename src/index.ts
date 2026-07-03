import {Ctx, codebox} from "./context";
import {Button} from "./buttons";
import {Mouse} from "./mouse";

const canvas = document.getElementById("canvas-main")! as HTMLCanvasElement;
const HEIGHT = 400;
const WIDTH = 400;
const SCALE = 1;

const updateRate = 60;
const DeltaTime = 1/60; // s


canvas.width = WIDTH*SCALE;
canvas.height = HEIGHT*SCALE;

const loadImage = (path: string): Promise<HTMLImageElement> => {
    const image = new Image();
    image.src = path;
    return new Promise(r => {image.onload = () => r(image)});
};

const ctx = canvas.getContext("2d");
const mouse: Mouse = {x: 0, y: 0, captured_output: 0, clicked: false};
const keypad = new Ctx();

const mouseMove = (e: MouseEvent, mouse: Mouse) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
}

function mouseDown(e: MouseEvent, mouse: Mouse): void{
    mouse.clicked = true;
}

function mouseUp(e: MouseEvent, mouse: Mouse): void{
    mouse.clicked = false;
}

canvas.addEventListener("mousemove", (e: MouseEvent) =>{
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

canvas.addEventListener("mousedown", () => {
    keypad.check_click(mouse);
});

canvas.addEventListener("mouseup", () => {
    mouse.clicked = false;
    mouse.captured_output = -3;
})

const drawBase = () => {
    
}
