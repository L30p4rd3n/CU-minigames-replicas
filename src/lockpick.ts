import {Lock, handAngle } from './lock.ts';
import type { Mouse } from './mouse.ts';
import type { ActiveComponent } from './buttons.ts';
import { SCALE } from './util/constants.ts';

import "./style.css"
import { inRange, quickfire } from './util/util.ts';

const loadImage = (path: string): Promise<HTMLImageElement> => {
    const image = new Image();
    image.src = path;
    return new Promise(r => {image.onload = () => r(image)});
};

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
 const plushImage = await loadImage("assets/image/experimentplush.png");

const lockRect: ActiveComponent = {
    cx: canvas.width / 2,
    cy: 400,
    angle: 0
};

let int: number = 10;
let useLockpick: boolean = false;
let containerType: number = 0;
let hidden = true;
minigame.initState(lockRect, useLockpick, int, containerType);

const drawBase = () => {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    //ctx.drawImage(LockBG, 0, 0, LockBG.width, LockBG.height); // didn't find the bg image
    if(!minigame.beaten){
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
                    0 - LockRectImage.width / 2 * SCALE * 1.5 + minigame.lockJitterX,
                    0 - LockRectImage.height / 2 * SCALE * 1.5 + minigame.lockJitterY,
                    LockRectImage.width * SCALE * 1.5, 
                    LockRectImage.height * SCALE * 1.5);
        ctx.restore();
    }else{
        /// мне в голову пришли хиханьки-хаханьки...
        ctx.drawImage(plushImage, canvas.width / 2 - plushImage.width / 2 * SCALE * 4, canvas.height / 2 - plushImage.height / 2 * SCALE * 4, plushImage.width * SCALE * 4, plushImage.height * SCALE * 4);
    }
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
}

canvas.addEventListener("mousemove", (e: MouseEvent) => {
    let pos = getMousePos(e);
    mouse.x = pos.x;
    mouse.y = pos.y;
});

canvas.addEventListener("mousedown", (e: MouseEvent) => {
    mouse.clicked = true;
    minigame.justClickedX = mouse.x;
    minigame.justClickedY = mouse.y;

    if(minigame.beaten && inRange((e.clientX - canvas.getBoundingClientRect().left) * (canvas.width / canvas.getBoundingClientRect().width),
                                      (canvas.width) / 2 - plushImage.width / 2 * SCALE * 4,
                                      (canvas.width) / 2 + plushImage.width / 2 * SCALE * 4)
                            && inRange(((e.clientY - canvas.getBoundingClientRect().top) * (canvas.width / canvas.getBoundingClientRect().width)),
                                      (canvas.height) / 2 - plushImage.height / 2 * SCALE * 4,
                                      (canvas.height) / 2 + plushImage.height / 2 * SCALE * 4)){
        quickfire(`assets/sound/plushie.ogg`); // this CAN DDoS, i am CERTAIN.
    }
});

canvas.addEventListener("mouseup", () => {
    mouse.clicked = false;

    minigame.lockJitterX = 0;
    minigame.lockJitterY = 0;
})

const logStats = () => {
    let logs = document.getElementById("logs")!;
    logs.style = 'font-family: "Retro Gaming";src: url("assets/font/RetroGaming.ttf");text-rendering: optimizeSpeed; color: white';
    if(!hidden){
        logs.innerHTML = 
        `<p>Stats:</p>
        <p>INT: ${int}</p>
        <p>correctAngle: ${minigame.correctAngle}</p>
        <p>currentAngle: ${handAngle(minigame.justClickedX, minigame.justClickedY).toFixed(2)}</p>
        <p>lockProgress: ${minigame.lockProgress.toFixed(2)}</p>
        <p>Pain: ${minigame.trackPain}</p>
        <p>Claw Health: ${minigame.trackClawHealth}</p>
        <p>Lockpicking kit durability:${(useLockpick && int > 10) ? minigame.trackLockpick.toFixed(2) : "you're too dumb to use it :D"}</p>
        `;
    }else{
        logs.innerHTML = ``;
    }
}

let lastT = 0;
setInterval(() => {
    if(!lastT){
        lastT = Date.now();
        return;
    }
    const delta = (Date.now() - lastT) * 0.001;
    drawBase();
    tickAction(delta);
    logStats();
    lastT = Date.now();
}, 1000 / 60);
drawBase();

document.getElementById("addint")!.addEventListener("click", () => {
    int += 1;
});
document.getElementById("removeint")!.addEventListener("click", () => {
    int -= 1;
});
document.getElementById("uselockpick")!.addEventListener("click", () => {
    useLockpick = !useLockpick;
});
document.getElementById("type1")!.addEventListener("click", () => {
    containerType = 0;
});
document.getElementById("type2")!.addEventListener("click", () => {
    containerType = 1;
});
document.getElementById("type3")!.addEventListener("click", () => {
    containerType = 2;
});
document.getElementById("toggle-hidden")!.addEventListener("click", () => {
    hidden = !hidden;
});
document.getElementById("restart")!.addEventListener("click", () => {
    minigame.initState(lockRect, useLockpick, int, containerType);
});