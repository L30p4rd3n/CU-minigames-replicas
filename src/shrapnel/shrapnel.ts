import type { Mouse } from '../mouse.ts';
import { ShrapnelMinigame } from './shrapnelClass.ts'
import { loadImage, randrange } from '../util/util.ts';
import { SCALE } from '../util/constants.ts';

import "../style.css"
import { coordsToVector, type Vector2 } from '../util/maths.ts';

const WIDTH = 400;
const HEIGHT = 256;

// bare minimum. TODO: hand images, sounds(that are not quickfired)
const backgroundImage = await loadImage("assets/image/minigameShrapnel.png");
const shrapnelImage = await loadImage("assets/image/shrapnelPiece.png");

const handGraspIdleImage = await loadImage("assets/image/handGraspIdle1.png");
const handGraspClickImage = await loadImage("assets/image/handGraspClick.png")
const sprites = {
    Grasp: handGraspIdleImage,
    GraspClick: handGraspClickImage
};

const canvas = document.getElementById("main-canvas")! as HTMLCanvasElement;
canvas.width = WIDTH * SCALE;
canvas.height = HEIGHT * SCALE;

const ctx = canvas.getContext("2d")!;
ctx.imageSmoothingEnabled = false;

/* run init stuff */
// NOTE: new (0,0). now the relative coordinates are the same as absolute 
ctx.translate(canvas.width / 2, canvas.height / 2);
const mouse: Mouse = {x: 0, y: 0, captured_output: 0, clicked: false}; // now the mouse is also at new (0, 0)?
const backtrackMouse: Mouse = {x: 0, y: 0, captured_output: 0, clicked: false}
const minigame = new ShrapnelMinigame();

let hasTweezers = false;
let limb = "HandF";
let shrapnelAmount = 2;
minigame.initState(hasTweezers, limb, shrapnelAmount, mouse);
minigame.objects.forEach(element => {
    element.width = shrapnelImage.width;
    element.height = shrapnelImage.height;
})

// TODO: move to mouse.ts 
function getMousePos(e: MouseEvent){
    let rect = canvas.getBoundingClientRect();

    const absX = (e.clientX - rect.left) * (canvas.width / rect.width);
    const absY = (e.clientY - rect.top) * (canvas.height / rect.height); // ?? test if that works

    return {
        x: absX,
        y: absY
    }
}

let velocityVector: Vector2 = {x: 0, y: 0};
let hasMoved: boolean = false;

canvas.addEventListener("mousemove", (e: MouseEvent) =>{
    backtrackMouse.x = mouse.x;
    backtrackMouse.y = mouse.y;

    let pos = getMousePos(e);
    mouse.x = pos.x - canvas.width / 2;
    mouse.y = -1 * (pos.y - canvas.height / 2);

    velocityVector = coordsToVector(backtrackMouse.x, mouse.x, backtrackMouse.y, mouse.y); // divided by SCALE
    hasMoved = true;
});

canvas.addEventListener("mousedown", () => {
    mouse.clicked = true;
    // minigame.justClickedX = mouse.x
});

canvas.addEventListener("mouseup", () => {
    mouse.clicked = false;
})

const drawBase = () => {
    ctx.fillStyle = "#000";
    ctx.fillRect(-(canvas.width / 2), -canvas.height / 2, canvas.width, canvas.height);

    minigame.objects.forEach(element => { // shrapnel is overlapped by BG
        let boundingbox = element.getRect();
        ctx.drawImage(shrapnelImage, element.x - element.width, -element.y - element.height, (boundingbox.ru.x - boundingbox.lu.x), Math.abs(boundingbox.lu.y - boundingbox.ld.y));
        /* debug item hitboxes. TODO: add a toggle switch
        ctx.fillStyle = "#F00"
        ctx.globalAlpha = 0.5;
        ctx.fillRect(boundingbox.lu.x, -element.y - element.height, 
                    (boundingbox.ru.x - boundingbox.lu.x), 
                    Math.abs(boundingbox.lu.y - boundingbox.ld.y));
        ctx.globalAlpha = 1;
        */
    });
    ctx.drawImage(backgroundImage, -backgroundImage.width * SCALE, 102, backgroundImage.width * SCALE * 2, backgroundImage.height * SCALE * 2); // I HATE THIS
    /*debug collision boxes
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = "#F80"
    ctx.fillRect(-(canvas.width / 2 * 1.5), canvas.height / 2 - 170, canvas.width * 1.5, backgroundImage.height * SCALE);
    ctx.fillStyle = "#0F0";
    ctx.fillRect(-(canvas.width / 2 * 1.5), 170, canvas.width * 1.5, backgroundImage.height * SCALE);
    ctx.globalAlpha = 1;
    */
    //TODO: draw corresponding hand
}

const logStats = () => {
    let logs = document.getElementById("logs")!;
    logs.style = 'font-family: "Retro Gaming";src: url("assets/font/RetroGaming.ttf");text-rendering: optimizeSpeed; color: white';
    logs.innerHTML = `pain: ${minigame.trackPain.toFixed(2)}`
}

const tickAction = (delta: number) => {
    // TODO + NOTE: i have no fucking clue how to scale it
    minigame.attachedHand.handVelocityX = velocityVector.x / delta / canvas.width * SCALE * SCALE;
    minigame.attachedHand.handVelocityY = velocityVector.y / delta / canvas.height * SCALE * SCALE; // what the fuck
    minigame.Update();
    
    if(minigame.trackPain > 0){
        // TODO: actual pain decrease value
        minigame.trackPain -= delta;
    }if(minigame.trackPain < 0){
        minigame.trackPain = 0;
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

    if(!hasMoved){
        velocityVector = {x: 0, y: 0};
    }
    hasMoved = false;
    lastT = Date.now();
}, 1000 / 60);
drawBase();

