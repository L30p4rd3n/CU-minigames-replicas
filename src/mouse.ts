interface Mouse{
    x: number;
    y: number;
    captured_output: number;
    clicked: boolean;
}

function mouseMove(e: MouseEvent, mouse: Mouse): void{
    mouse.x = e.clientX;
    mouse.y = e.clientY;
}

function mouseDown(e: MouseEvent, mouse: Mouse): void{
    mouse.clicked = true;
}

function mouseUp(e: MouseEvent, mouse: Mouse): void{
    mouse.clicked = false;
}

export {Mouse}