import {sayHello} from "./greet";
import {Scene} from "./graphics";

console.log(sayHello("TypeScript"));
let canvasElement = document.getElementById("view");
let canvas = canvasElement as HTMLCanvasElement;

const scene = new Scene(canvas);
