import {Lock, handAngle} from './lock.ts';
import type { Mouse } from './mouse.ts';
import type { ActiveComponent } from './buttons.ts';

import "./style.css"

const loadImage = (path: string): Promise<HTMLImageElement> => {
    const image = new Image();
    image.src = path;
    return new Promise(r => {image.onload = () => r(image)});
};

const SCALE = 2.4;
const WIDTH = 400;
const HEIGHT = 400;

const canvas = document.getElementById("main-canvas")! as HTMLCanvasElement;
canvas.width = WIDTH * SCALE;
canvas.height = HEIGHT * SCALE;

const ctx = canvas.getContext("2d")!;
ctx.imageSmoothingEnabled = false;

const mouse: Mouse = {x: 0, y: 0, captured_output: 0, clicked: false};
const minigame = new Lock();

const LockRectImage = await loadImage("./assets/image/lockpickLock.png");
// const LockBG = await loadImage("assets/image/bg.png");
const LockArchImage = await loadImage("assets/image/lockpickArch.png");

const lockRect: ActiveComponent = {
    cx: canvas.width / 2,
    cy: 400,
    angle: 0
};

minigame.initState(lockRect); // should have a restart, but oh well

const drawBase = () => {
    //ctx.drawImage(LockBG, 0, 0, LockBG.width, LockBG.height);
    ctx.drawImage(LockArchImage, 
                  lockRect.cx - LockArchImage.width / 2 * SCALE * 1.5,
                  lockRect.cy - LockArchImage.height * SCALE * 1.5,
                  LockArchImage.width * SCALE * 1.5,
                  LockArchImage.height * SCALE * 1.5
                );

    ctx.fillStyle = "#ffffff";
    ctx.font = "42px Retro Gaming";
    ctx.textAlign = "center";
    ctx.fillText(minigame.innerText, canvas.width / 2, 50);

    ctx.save();
    
    ctx.translate(lockRect.cx, lockRect.cy);
    ctx.rotate(minigame.lockRect.angle);
    ctx.drawImage(LockRectImage,
                 0 - LockRectImage.width / 2 * SCALE * 1.5,
                 0 - LockRectImage.height / 2 * SCALE * 1.5,
                 LockRectImage.width * SCALE * 1.5, 
                 LockRectImage.height * SCALE * 1.5);
    ctx.restore();
};


function getMousePos(e: MouseEvent){
    let rect = canvas.getBoundingClientRect();

    const absX = (e.clientX - rect.left) * (canvas.width / rect.width);
    const absY = (e.clientY - rect.top) * (canvas.height / rect.height);

    return {
        x: absX - lockRect.cx,
        y: absY - lockRect.cy
    }
}

const tickAction = (delta: number) => {
    minigame.handle_click(mouse, delta);
    // draw stuff accordingly idk
}

canvas.addEventListener("mousemove", (e: MouseEvent) =>{
    let pos = getMousePos(e);
    mouse.x = pos.x;
    mouse.y = pos.y;
});

canvas.addEventListener("mousedown", () => {
    mouse.clicked = true;
});

canvas.addEventListener("mouseup", () => {
    mouse.clicked = false;
})

const logStats = () => {
    /// something something log some stats...
}

let lastT = 0;
setInterval(() => {
    if(!lastT){
        lastT = Date.now();
        return;
    }
    const delta = (Date.now() - lastT);
    drawBase();
    tickAction(delta);
    logStats();
    lastT = Date.now();
}, 1000 / 60);
drawBase();