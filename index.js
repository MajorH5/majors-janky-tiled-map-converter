import { MapRenderer } from "./tools/mapRenderer.js";
import { TilesetRenderer } from "./tools/tilesetRenderer.js";

const canvas = document.getElementById("canvas");
const context = canvas.getContext("2d");

let mapRenderer = new MapRenderer(canvas);
let tileset = new TilesetRenderer();

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

context.imageSmoothingEnabled = false;

const mapImageInput = document.getElementById("mapImageInput");
const tilesetInput = document.getElementById("tilesetInput");

function onNewMapImported (texture, size) {
    mapRenderer.setTexture(texture, size);
}

function onNewTilesetImported (texture, size) {
    console.log(texture, size);
}

const listenImageTextureImport = (inputNode, callback) => {
    inputNode.addEventListener("change", async () => {
        if (inputNode.files.length !== 1) {
            return
        }

        const importFile = inputNode.files[0]

        const texture = document.createElement("img");
        texture.src = URL.createObjectURL(importFile);

        const [width, height] = await new Promise((resolve) => {
            texture.onload = () => {
                resolve([texture.width, texture.height]);
            };
        });

        callback(texture, { x: width, y: height })
    });
}

function render () {
    mapRenderer.render();
    requestAnimationFrame(render);
}

listenImageTextureImport(mapImageInput, onNewMapImported);
listenImageTextureImport(tilesetInput, onNewTilesetImported);

render();