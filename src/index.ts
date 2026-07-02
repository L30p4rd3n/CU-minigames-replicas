import {Ctx} from "./context";
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

