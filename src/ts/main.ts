import {sayHello} from "./greet";
import {Scene, GetRenderFn} from "./graphics";
import { Sprite, TextureView } from "./js13k2d/Renderer";
import { SquareSprite } from "./spritedefs/shape_sprites";

console.log(sayHello("TypeScript"));
let canvasElement = document.getElementById("view");
let canvas = canvasElement as HTMLCanvasElement;

const scene = new Scene(canvas);

const square = new Sprite(scene.AddTexture(SquareSprite()));
square.position.set(100, 100);
scene.Add(square);

requestAnimationFrame(GetRenderFn(scene));
