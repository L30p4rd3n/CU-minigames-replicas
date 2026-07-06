import {Lock, findCenter, handAngle} from './lock.ts';
import type { Mouse } from './mouse.ts';
import type { ActiveComponent } from './buttons.ts';

import "./style.css"
import { relativeX, relativeY } from './util/maths';

const loadImage = (path: string): Promise<HTMLImageElement> => {
    const image = new Image();
    image.src = path;
    return new Promise(r => {image.onload = () => r(image)});
};

const SCALE = 2.4;
const WIDTH = 500;
const HEIGHT = 500;

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
    x: 150,
    y: 150,
    width: LockRectImage.width,
    height: LockRectImage.height,
    angle: 0
};

minigame.initState(lockRect); // should have a restart, but oh well

const drawBase = () => {
    //ctx.drawImage(LockBG, 0, 0, LockBG.width, LockBG.height);
    ctx.drawImage(LockArchImage, 0, 0, LockArchImage.width * SCALE * 1.5, LockArchImage.height * SCALE * 1.5);

    ctx.fillStyle = "#ffffff";
    ctx.font = "42px Retro Gaming";
    ctx.textAlign = "center";
    ctx.fillText(minigame.innerText, canvas.width / 2, 50);

    ctx.save();
    
    ctx.translate(canvas.width / 2 - LockRectImage.width / 2, 150);
    ctx.rotate(minigame.lockRect.angle);
    ctx.drawImage(LockRectImage, 0, 0, LockRectImage.width * SCALE , LockRectImage.height * SCALE);
    ctx.restore();
};


function getMousePos(e: MouseEvent){
    let rect = canvas.getBoundingClientRect();
    return {
        x: relativeX(e.clientX - rect.left, findCenter(lockRect).x) * (canvas.width / rect.width),
        y: relativeY(e.clientY - rect.top, findCenter(lockRect).y) * (canvas.height / rect.height)
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
    console.log(handAngle(mouse, lockRect));
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