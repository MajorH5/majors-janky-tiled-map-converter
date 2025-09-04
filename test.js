import { CanvasUI } from './CanvasUI/CanvasUI.js';
import { UIText } from './CanvasUI/components/uiText.js';

const canvas = document.getElementById("canvas");
const context = canvas.getContext("2d");

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

context.imageSmoothingEnabled = false;

const manager = new CanvasUI(canvas);

const text = new UIText("test", {

});

manager.addObject(text);