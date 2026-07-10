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
    element.x = randrange(-(canvas.width / 7), (canvas.width / 7))
    element.width = shrapnelImage.width / 2 * SCALE;
    element.height = shrapnelImage.height / 2 * SCALE; 
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

canvas.addEventListener("mousemove", (e: MouseEvent) =>{
    backtrackMouse.x = mouse.x;
    backtrackMouse.y = mouse.y;

    let pos = getMousePos(e);
    mouse.x = pos.x - canvas.width / 2;
    mouse.y = -1 * (pos.y - canvas.height / 2);
    
    velocityVector = coordsToVector(backtrackMouse.x, mouse.x, backtrackMouse.y, mouse.y); // divided by SCALE
    //console.log(velocityVector);
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
    ctx.fillRect(0, -canvas.height / 2, canvas.width, canvas.height);

    minigame.objects.forEach(element => { // shrapnel is overlapped by BG
        let boundingbox = element.getRect();
        ctx.drawImage(shrapnelImage, boundingbox.lu.x * SCALE, boundingbox.lu.y * SCALE, shrapnelImage.width * SCALE, shrapnelImage.height * SCALE);
    })
    ctx.drawImage(backgroundImage, -(canvas.width / 2 * 1.5), 0, canvas.width * 1.5, backgroundImage.height * SCALE);
    //TODO: draw corresponding hand
}

const logStats = () => {
    /// log some stats, based on current settings
}

const tickAction = (delta: number) => {
    minigame.Update();
    if(minigame.trackPain > 0){
        // TODO; actual pain decrease value
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
    lastT = Date.now();
}, 1000 / 60);
drawBase();

