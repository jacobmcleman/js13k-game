import { Renderer } from './js13k2d/Renderer';
import { Vec2 } from './geometry';

export interface Color {
    red: number;
    green: number;
    blue: number;
    alpha?: number;
}

export class Scene {
    scene: any;

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
}
