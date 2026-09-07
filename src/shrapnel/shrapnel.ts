import type { Mouse } from '../mouse.ts';
import { ShrapnelMinigame } from './shrapnelClass.ts'
import { loadImage } from '../util/util.ts';
import { SCALE } from '../util/constants.ts';

import "../style.css"
import { Clamp } from '../util/maths.ts';

const WIDTH = 400;
const HEIGHT = 256;

const backgroundImage = await loadImage("assets/image/minigameShrapnel.png");
const shrapnelImage = await loadImage("assets/image/shrapnelPiece.png");

const handGraspIdleImage = await loadImage("assets/image/handGraspIdle1.png");
const handGraspClickImage = await loadImage("assets/image/handGraspClick.png")
const handTweezersIdleImage = await loadImage("assets/image/handTweezersIdle.png");
const handTweezersClickImage = await loadImage("assets/image/handTweezersClick.png");

const canvas = document.getElementById("main-canvas")! as HTMLCanvasElement;
canvas.width = WIDTH * SCALE;
canvas.height = HEIGHT * SCALE;

const ctx = canvas.getContext("2d")!;
ctx.imageSmoothingEnabled = false;

ctx.translate(canvas.width / 2, canvas.height / 2);
const mouse: Mouse = {x: 0, y: 0, captured_output: 0, clicked: false};
const backtrackMouse: Mouse = {x: 0, y: 0, captured_output: 0, clicked: false}
const minigame = new ShrapnelMinigame();


let hasTweezers = false;
let limb = "HandF";
let shrapnelAmount = 5;
minigame.initState(hasTweezers, limb, shrapnelAmount, mouse);
const afterInit = () => {
    minigame.objects.forEach(element => {
        element.width = shrapnelImage.width;
        element.height = shrapnelImage.height;

        element.x += (Math.random() * 250) - 125;
        element.y -= 60;
})};
afterInit();


// TODO: move to mouse.ts 
function getMousePos(e: MouseEvent){
    let rect = canvas.getBoundingClientRect();

    const absX = (e.clientX - rect.left) * (canvas.width / rect.width);
    const absY = (e.clientY - rect.top) * (canvas.height / rect.height); 

    return {
        x: absX,
        y: absY
    }
}

canvas.addEventListener("pointermove", (e: MouseEvent) =>{
    backtrackMouse.x = mouse.x;
    backtrackMouse.y = mouse.y;


    let pos = getMousePos(e);
    mouse.x = pos.x - canvas.width / 2;
    mouse.y = -1 * (pos.y - canvas.height / 2);
});

canvas.addEventListener("pointerdown", () => {
    mouse.clicked = true;
    // minigame.justClickedX = mouse.x
});

canvas.addEventListener("pointerup", () => {
    mouse.clicked = false;
})

const drawHand = () => {
    ctx.globalAlpha = 0.75;
    // ctx.fillStyle = "#CF07AA";
    // ctx.fillRect(minigame.attachedHand.x - 8, -minigame.attachedHand.y - 8, 16, 16);
    if(mouse.clicked){
        if(!minigame.hasTweezers){
            ctx.drawImage(handGraspClickImage, minigame.attachedHand.x - handGraspClickImage.width / 2 - shrapnelImage.width - 15, 
                        -minigame.attachedHand.y  - handGraspClickImage.height / 4 - 60, 
                        handGraspClickImage.width * SCALE, 
                        handGraspClickImage.height * SCALE)
        }else{
            ctx.drawImage(handTweezersClickImage, minigame.attachedHand.x - handGraspClickImage.width / 2 - shrapnelImage.width - 15, 
                        -minigame.attachedHand.y  - handGraspClickImage.height / 4 - 60, 
                        handGraspClickImage.width * SCALE, 
                        handGraspClickImage.height * SCALE)
        }
    }else{
        if(!minigame.hasTweezers){
            ctx.drawImage(handGraspIdleImage, minigame.attachedHand.x - handGraspClickImage.width / 2 - shrapnelImage.width - 15, 
                        -minigame.attachedHand.y - handGraspClickImage.height / 4 - 60, 
                        handGraspIdleImage.width * SCALE, 
                        handGraspIdleImage.height * SCALE)
        }else{
            ctx.drawImage(handTweezersIdleImage, minigame.attachedHand.x - handGraspClickImage.width / 2 - shrapnelImage.width - 15, 
                        -minigame.attachedHand.y  - handGraspClickImage.height / 4 - 60, 
                        handGraspClickImage.width * SCALE, 
                        handGraspClickImage.height * SCALE)
        }
    }
    ctx.globalAlpha = 1;
}

const drawBase = () => {
    ctx.fillStyle = "#000";
    ctx.fillRect(-(canvas.width / 2), -canvas.height / 2, canvas.width, canvas.height);

    minigame.objects.forEach(element => {
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
}

let hidden: boolean = true;
const logStats = () => {
    let logs = document.getElementById("logs")!;
    logs.style = 'font-family: "Retro Gaming";src: url("assets/font/RetroGaming.ttf");text-rendering: optimizeSpeed; color: white';
    if(!hidden){
        if(minigame.beaten){
            logs.innerHTML = "The game is beaten. Press Restart to restart the minigame";
        }else{
            logs.innerHTML =`<p>Stats:</p>
                            <p>Pain: ${minigame.trackPain.toFixed(0)}</p>
                            <p>Bleeding: ${(minigame.trackBleedAmount * 0.015).toFixed(3)} L/m</p>
                            <p>Skin health: ${minigame.trackSkinHealth.toFixed(2)}</p>
                            <p>${minigame.isLimbAHead ? "Brain health: " + minigame.trackBrainHealth.toFixed(2) : ""}</p>
                            <p>Shards remaining: ${minigame.shrapnelAmount}</p>`
        }
        if(minigame.trackBrainHealth <= 30){
            logs.innerHTML = `
            <p>You're comatose. How did you even end up here?</p>
            `
        }
        
    }else{
        logs.innerHTML = ``;
    }
}

const tickAction = (delta: number) => {
    minigame.Update();
    minigame.trackPain = Clamp(minigame.trackPain - delta, 0, 105); // in-game: 5*deltaTime, but there are more variables
    // no other increase/decrease
}

let lastT = 0;
setInterval(() => {
    if(!lastT){
        lastT = Date.now();
        return;
    }
    const delta = (Date.now() - lastT) * 0.001;
    drawBase();
    drawHand();
    tickAction(delta);
    logStats();
    lastT = Date.now();
}, 1000 / 60);
drawBase();


document.getElementById("ahead")!.addEventListener("click", () => {
    limb = `${minigame.isLimbAHead ? "HandF" : "Head"}`;
    minigame.isLimbAHead = ! minigame.isLimbAHead;
    minigame.initState(hasTweezers, limb, shrapnelAmount, mouse);   
    afterInit();
});
document.getElementById("usetweezers")!.addEventListener("click", () => {
    hasTweezers = !hasTweezers;
    minigame.initState(hasTweezers, limb, shrapnelAmount, mouse);
    afterInit();
});
document.getElementById("toggle-hidden")!.addEventListener("click", () => {
    hidden = !hidden;
});
document.getElementById("restart")!.addEventListener("click", () => {
    minigame.initState(hasTweezers, limb, shrapnelAmount, mouse);   
    afterInit();
});
document.getElementById("shr1")!.addEventListener("click", () => {
    shrapnelAmount = Clamp(shrapnelAmount+1, 0, 5);
    minigame.initState(hasTweezers, limb, shrapnelAmount, mouse);   
    afterInit();
});
document.getElementById("shr2")!.addEventListener("click", () => {
    shrapnelAmount = Clamp(shrapnelAmount-1, 0, 5);
    minigame.initState(hasTweezers, limb, shrapnelAmount, mouse);  
    afterInit(); 
});