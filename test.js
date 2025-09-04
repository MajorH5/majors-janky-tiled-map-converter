import { CanvasUI } from './CanvasUI/CanvasUI.js';
import { UIText } from './CanvasUI/components/uiText.js';
import { Vector2 } from './CanvasUI/utils/vector2.js';

const canvas = document.getElementById("canvas");
const context = canvas.getContext("2d");

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

context.imageSmoothingEnabled = false;

const manager = new CanvasUI(canvas, true);

const text = new UIText("test", {
    size: new Vector2(100, 100)
});

const text2 = new UIText("test2", {
    size: new Vector2(100, 100),
    positionScale: new Vector2(.5, .5),
    // pivot: new Vector2(.5, .5),
    clickable: true,
});
text2.parentTo(text);

manager.addObject(text);

let lastFrame = Date.now();

function loop () {
    const now = Date.now();
    const deltaTime = now - lastFrame;

    manager.update(deltaTime);
    manager.render();

    requestAnimationFrame(loop);
}

loop();