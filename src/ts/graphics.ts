import { Renderer, Sprite, TextureView } from './js13k2d/Renderer';
import { Vec2 } from './geometry';
import { start } from 'repl';

export interface Color {
    red: number;
    green: number;
    blue: number;
    alpha?: number;
}

export class Scene {
    scene: any;
    startTime: number;
    currentTime: number;
    deltaTime: number;

    constructor(view: HTMLCanvasElement){
        if( view === null ) console.log("NO VIEW CANVAS PANICKSADASD");

        this.scene = Renderer(view);
        
        this.SetBackground({red: 1, green: 0, blue: 1});
        this.CenterOn({x: 100, y: 100})
    }

    SetBackground(color: Color) {
        this.scene.background(color.red, color.green, color.blue, color.alpha || 1);
    }

    CenterOn(position: Vec2) {
        this.scene.camera.at.set(position.x, position.y);
        this.scene.camera.to.set(0.5, 0.5);
    }

    Add(sprite: Sprite) {
        this.scene.add(sprite);
    }

    UpdateTime(time: number) {
        if(this.startTime == NaN) {
            this.startTime = time;
        }

        this.deltaTime = time - this.currentTime;
        this.currentTime = time;
    }

    AddTexture(source: TexImageSource): TextureView {
        return this.scene.texture(source);
    }

    Render() {
        let red = (Math.sin(this.currentTime / 1000) + 1) * 0.5;
        let green = 1;
        let blue = 1 - (Math.sin(this.currentTime / 1000) + 1) * 0.5;
        this.SetBackground({red, green, blue});
        this.scene.render();
    }
}

export function GetRenderFn(scene: Scene) {
    return (time: number) => {
        scene.UpdateTime(time);
        scene.Render();
        requestAnimationFrame(GetRenderFn(scene));
    }
}