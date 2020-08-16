
export function SquareSprite(){
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const size = 32;
    const half = size / 2;

    const ctx = canvas.getContext('2d');

    ctx.lineWidth = size / 16;
    ctx.fillStyle = '#cccccc';
    ctx.strokeStyle = '#000000';
    ctx.beginPath();

    ctx.moveTo(0, 0);
    ctx.moveTo(0, size);
    ctx.moveTo(size, size);
    ctx.moveTo(size, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    return canvas;
}