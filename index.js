import { CanvasUI } from './CanvasUI/CanvasUI.js';
import { UIBase } from './CanvasUI/components/uiBase.js';
import { UIImage } from './CanvasUI/components/uiImage.js';
import { UIText } from './CanvasUI/components/uiText.js';
import { Vector2 } from './CanvasUI/utils/vector2.js';

const mapImageInput = document.getElementById("mapImageInput");
const tilesetInput = document.getElementById("tilesetInput");

const canvas = document.getElementById("canvas");
const context = canvas.getContext("2d");

const ui = new CanvasUI(canvas, true);

const importMessage = new UIText("Please select a map image to import.", {
    size: new Vector2(300, 100),
    pivot: new Vector2(0.5, 0.5),
    positionScale: new Vector2(0.5, 0.5),
    fontColor: '#cccccc'
});
ui.addObject(importMessage);

const tilesetDrawer = new UIBase({
    size: new Vector2(200, -125),
    sizeScale: new Vector2(0, 1),
    positionScale: new Vector2(1, 0),
    pivot: new Vector2(1, 0),
    borderSize: 2,
    backgroundColor: '#ffffff',
    backgroundEnabled: true,
    visible: false
});

const header = new UIText("Tilesets", {
    sizeScale: new Vector2(1, 0.05),
    backgroundEnabled: true,
    transparency: 0.15,
});
header.parentTo(tilesetDrawer);

const tilesetContainer = new UIBase({
    sizeScale: new Vector2(1, 0.95),
    positionScale: new Vector2(0, 0.05),
    clipChildren: true,
    scrollableY: true,
});
tilesetContainer.parentTo(tilesetDrawer)

ui.addObject(tilesetDrawer);

const tileInspector = new UIBase({
    size: new Vector2(0, 125),
    sizeScale: new Vector2(1, 0),
    positionScale: new Vector2(0, 1),
    pivot: new Vector2(0, 1),
    borderSize: 2,
    backgroundColor: '#ffffff',
    backgroundEnabled: true,
    visible: false
});

const tileDataContainer = new UIBase({
    sizeScale: new Vector2(1, 1)
});
tileDataContainer.parentTo(tileInspector);

function createTileLayer (layerName, index) {
    const layerDataContainer = new UIBase({
        sizeScale: new Vector2(1 / 3, 1),
        positionScale: new Vector2(index * (1 / 3), 0),
        borderSize: 1,
    });

    const layerHeader = new UIText(`${layerName} - layer`, {
        sizeScale: new Vector2(1, 0),
        size: new Vector2(0, 20),
        fontSize: 10,
    });
    layerHeader.parentTo(layerDataContainer);

    const baseTileImage = new UIImage('', {
        imageSize: new Vector2(8, 8),
        size: new Vector2(8, 8).scale(5),
        pivot: new Vector2(0.5, 0.5),
        positionScale: new Vector2(0.25, 0.5),
        backgroundColor: '#000000',
        backgroundEnabled: true,
        transparency: 0.25,
        borderSize: 1,
    });
    baseTileImage.parentTo(layerDataContainer);

    const indexText = new UIText('Tile Index: None', {
        positionScale: new Vector2(0.4, 0),
        sizeScale: new Vector2(0.5, 1),
        textXAlignment: 'left',
    });
    indexText.parentTo(layerDataContainer)

    layerDataContainer.parentTo(tileDataContainer);

    return {
        container: layerDataContainer,
        image: baseTileImage,
        indexText: indexText,
    }
}

const baseTileLayer = createTileLayer("base_tile", 0);
const decorationLayer = createTileLayer("decoration", 1);
const stackedObjectLayer = createTileLayer("stacked_object", 2);

ui.addObject(tileInspector);

const exportButton = new UIText("Export", {
    pivot: new Vector2(0.5, 0),
    positionScale: new Vector2(0.5, 0),
    position: new Vector2(-200 / 2, 15),
    size: new Vector2(100, 50),
    zIndex: 9999,
    backgroundEnabled: true,
    backgroundColor: '#ffffff',
    borderSize: 2,
    borderColor: '#aaaaaa',
    clickable: true,
    visible: false,
});

exportButton.mouseUp.listen(() => {
    exportMapToTiled();
})

ui.addObject(exportButton);

const tilesetData = [];
let mapTiles = [];
let mapSize = Vector2.zero;

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;
context.imageSmoothingEnabled = false;

function comparePixelData (arr1, arr2, skipTransparent) {
    if (arr1.length !== arr2.length) {
        return 0;
    }

    let matchedPixels = 0;
    let checkedCount = 0;

    for (let i = 0; i < arr1.length; i += 4) {  
        const r1 = arr1[i + 0];
        const g1 = arr1[i + 1];
        const b1 = arr1[i + 2];
        const a1 = arr1[i + 3];

        if (skipTransparent && a1 === 0) {
            continue;
        }

        checkedCount += 1;
        
        const r2 = arr2[i + 0];
        const g2 = arr2[i + 1];
        const b2 = arr2[i + 2];
        const a2 = arr2[i + 3];

        if (
            r1 === r2 &&
            g1 === g2 &&
            b1 === b2 &&
            a1 === a2
        ) {
            matchedPixels += 1;
        }
    }

    return matchedPixels / checkedCount;
}

function isEmptyPixelData(arr1) {
    return arr1.every(value => value === 0);
}

function isUniformColor(arr1) {
    for (let i = 0; i < arr1.length; i += 4) {  
        const a = arr1[i + 3];

        if (a !== 255) {
            return false;
        }
        
        const r = arr1[i + 0];
        const g = arr1[i + 1];
        const b = arr1[i + 2];

        const expectedR = arr1[0];
        const expectedG = arr1[1];
        const expectedB = arr1[2];

        if (
            r !== expectedR ||
            g !== expectedG ||
            b !== expectedB
        ) {
            return false;
        }
    }

    return true;
}

function readPartialImageData (image, sx, sy, sw, sh) {
    const canvas = document.createElement('canvas');
    canvas.width = sw;
    canvas.height = sh;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, sx, sy, sw, sh, 0, 0, sw, sh);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    return imageData.data;
}

function createBlobUrlFromImageData(imageDataArray, width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    
    const imageData = new ImageData(imageDataArray, width, height);
    
    ctx.putImageData(imageData, 0, 0);
    
    return new Promise((resolve) => {
        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            resolve(url);
        }, 'image/png');
    });
}

function exportMapToTiled () {
    if (mapSize.magnitude() === 0) {
        return;
    }
    const tiledExport = {};
    let layerId = 0;

    const createExportLayerObject = (layerType) => {
        return {
            "class": layerType,
            "name": layerType,
            "data": new Array(mapSize.x * mapSize.y).fill(0),
            "width": mapSize.x,
            "height": mapSize.y,
            "id": layerId++,
            "opacity": 1,
            "type": "tilelayer",
            "visible": true,
            "x": 0,
            "y": 0,
        };
    };

    const tilesets = [];
    const createTilesetExportObject = (tileset) => {
        const lastTileset = tilesets.at(-1);
        let firstGid = 1;

        if (lastTileset) {
            firstGid = lastTileset.firstgid + lastTileset.tilecount;
        }

        const tilesetExport = {
            "columns": tileset.size.x,
            "firstgid": firstGid,
            "imagewidth": tileset.size.x * 8,
            "imageheight": tileset.size.y * 8,
            "image": `H:\/${tileset.name}\/`,
            "name": tileset.name,
            "tilecount": tileset.size.x * tileset.size.y,
            "tileheight": 8,
            "tilewidth": 8,
            "margin": 0,
            "spacing": 0,
        };

        tilesets.push(tilesetExport);

        return tilesetExport;
    };

    const localTilesetToExportSet = {};

    const baseTiles = createExportLayerObject("base_tiles");
    const decorations = createExportLayerObject("decorations");
    const stackedObjects = createExportLayerObject("stacked_objects");
    const SOvisuals = createExportLayerObject("SO_visuals");

    const writeTileToLayer = (targetLayer, position, tilesetTile) => {
        const localTileset = tilesetTile.tileset;
        let exportTileset = localTilesetToExportSet[localTileset.name];

        if (!exportTileset) {
            exportTileset = createTilesetExportObject(localTileset);
            localTilesetToExportSet[localTileset.name] = exportTileset; 
        }

        const localTileIndex = tilesetTile.index;
        const exportTileIndex = exportTileset.firstgid + localTileIndex;

        const layerIndex = position.y * mapSize.x + position.x;

        if (layerIndex >= 0 && layerIndex < targetLayer.data.length - 1) {
            targetLayer.data[layerIndex] = exportTileIndex;
        }
    };

    for (let i = 0; i < mapTiles.length; i++) {
        const tile = mapTiles[i];
        const tilePosition = tile.position;

        if (tile.baseTile) {
            writeTileToLayer(baseTiles, tilePosition, tile.baseTile);
        }
        
        if (tile.decorationTile) {
            writeTileToLayer(decorations, tilePosition, tile.decorationTile);
        }
        
        if (tile.stackedObjectTile) {
            writeTileToLayer(stackedObjects, tilePosition, tile.stackedObjectTile);            
            
            // assume height of 1
            const tileset = tile.stackedObjectTile.tileset;

            const SOPosition = tile.stackedObjectTile.position;

            const baseVoxelTile = tileset.tiles.find((tile) => {
                return tile.position.x === SOPosition.x + 1 &&
                    tile.position.y === SOPosition.y;
            });
            const topVoxelTile = tileset.tiles.find((tile) => {
                return tile.position.x === SOPosition.x + 1 &&
                    tile.position.y === SOPosition.y - 1;
            });

            if (baseVoxelTile) {
                writeTileToLayer(SOvisuals, tilePosition, baseVoxelTile);
            }

            if (topVoxelTile) {
                const offset = new Vector2(0, -1);
                writeTileToLayer(SOvisuals, tilePosition.add(offset), topVoxelTile);
            }
        }
    }

    // write layers to map
    tiledExport["layers"] = [
        baseTiles,
        decorations,
        stackedObjects,
        SOvisuals,
    ];

    // tileset data
    tiledExport["tilesets"] = tilesets;

    // write map metadata
    tiledExport["width"] = mapSize.x;
    tiledExport["height"] = mapSize.y;
    tiledExport["tilewidth"] = 8;
    tiledExport["tileheight"] = 8;
    tiledExport["nextobjectid"] = 9;
    tiledExport["nextlayerid"] = 9;
    tiledExport["infinite"] = false;
    tiledExport["compressionlevel"] = -1;
    tiledExport["orientation"] = "orthogonal";
    tiledExport["renderorder"] = "right-down";
    tiledExport["type"] = "map";
    tiledExport["tiledversion"] = "1.11.2";
    tiledExport["version"] = "1.10";

    const resultJSON = JSON.stringify(tiledExport);

    const blob = new Blob([resultJSON], { type: "application/json" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "exported_map.json";

    link.click();

    URL.revokeObjectURL(link.href);
}

function updateMapTileIndexData () {
    for (let i = 0; i < mapTiles.length; i++) {
        const tile = mapTiles[i];
        
        let highestMatchedTile = null;
        let fullMatchFound = false;
        
        for (let j = 0; j < tilesetData.length; j++){
            const tileset = tilesetData[j];
            
            for (let k = 0; k < tileset.tiles.length; k++) {
                const tilesetTile = tileset.tiles[k];
                const matchPercentage = comparePixelData(tilesetTile.pixelData, tile.pixelData, tileset.isDecorations);
                
                if (matchPercentage === 1) {
                    fullMatchFound = true;

                    tile.indicator.text = `${tileset.id}|${tilesetTile.index}`

                    if (tileset.isDecorations) {
                        tile.decorationTile = tilesetTile;
                    } else if (tilesetTile.isVoxel) {
                        tile.stackedObjectTile = tileset.tiles[k - 1];
                    } else if (!tilesetTile.ignored) {
                        tile.baseTile = tilesetTile;
                    } else {
                        // probably part of voxel top, assume
                        // bottom to be voxel
                        const bottomTileIndex = tile.index + mapSize.x;
                        const bottomTile = mapTiles.find((searchTile) => {
                            return searchTile.index === bottomTileIndex;
                        });

                        const SOTile = tileset.tiles.find((searchTile) => {
                            return searchTile.position.x === tilesetTile.position.x - 1 &&
                                searchTile.position.y === tilesetTile.position.y + 1;
                        });

                        if (bottomTile && SOTile) {
                            bottomTile.stackedObjectTile = SOTile;
                        }
                    }

                    highestMatchedTile = null;
                    break;
                } else if (highestMatchedTile === null || matchPercentage > highestMatchedTile.percentage) {
                    highestMatchedTile = {
                        tile: tilesetTile,
                        percentage: matchPercentage
                    };
                }
            }

            if (fullMatchFound) {
                break;
            }
        }

        if (highestMatchedTile !== null && highestMatchedTile.percentage > 0.1) {
            const matchedTile = highestMatchedTile.tile;
            const matchedTileset = matchedTile.tileset;

            if (tile.baseTile === null && !matchedTileset.isDecorations && !matchedTile.isVoxel && !matchedTile.ignored) {
                // pick the closest?

                tile.baseTile = matchedTile;
            }
        }
    }
}

function onNewMapImported (textureSrc, size, textureName, texture) {    
    if (size.x % 8 !== 0 || size.y % 8 !== 0) {
        alert("Inalid map! Must import map in original size with 8px x 8px sized tiles.");
        return;
    }

    const mapImage = new UIImage(textureSrc, {
        imageSize: new Vector2(size.x, size.y),
        size: new Vector2(size.x, size.y),
        clickable: true,
        zIndex: -100,
        borderSize: 2,
        borderColor: '#ff0000',
        scrollable: true,
    });

    const tilesX = size.x / 8;
    const tilesY = size.y / 8;

    const tiles = [];

    for (let y = 0; y < tilesY; y++) {
        for (let x = 0; x < tilesX; x++) {
            const tilePixelData = readPartialImageData(texture, x * 8, y * 8, 8, 8);
            const index = y * tilesX + x;

            if (isEmptyPixelData(tilePixelData)) {
                continue;
            }
        
            const tileIndicator = new UIText("?", {
                sizeScale: new Vector2(8 / size.x, 8 / size.y),
                positionScale: new Vector2(x * (8 / size.x), y * (8 / size.y)),
                fontColor: '#ffffff',
                fontSize: 8,
                textTransparency: 0,
                textXAlignment: 'left',
                textYAlignment: 'bottom',
                borderSize: 1,
                borderColor: 'rgba(255, 0, 0, 0.25)',
                backgroundColor: 'rgba(0, 255, 0, 0.19)',
            });
            
            const tile = {
                position: new Vector2(x, y),
                index: index,
                pixelData: tilePixelData,
                indicator: tileIndicator,

                baseTile: null,
                decorationTile: null,
                stackedObjectTile: null,
            };

            let grabPosition = mapImage.positionAbsolute;

            tileIndicator.mouseDown.listen(() => {
                grabPosition = mapImage.positionAbsolute;
            });
            
            tileIndicator.mouseUp.listen(async (position, mouse) => {
                if (mapImage.positionAbsolute.subtract(grabPosition).magnitude() > 5) {
                    return;
                }
                
                tileIndicator.backgroundEnabled = true;

                if (tile.baseTile) {
                    const blobUrl = await createBlobUrlFromImageData(tile.baseTile.pixelData, 8, 8);
                    baseTileLayer.image.setSrc(blobUrl);
                    baseTileLayer.indexText.text = `Tile Index: ${tile.baseTile.index}`;
                } else {
                    baseTileLayer.image.setSrc('');
                    baseTileLayer.indexText.text = `Tile Index: None`;
                }

                if (tile.decorationTile) {
                    const blobUrl = await createBlobUrlFromImageData(tile.decorationTile.pixelData, 8, 8);
                    decorationLayer.image.setSrc(blobUrl);
                    decorationLayer.indexText.text = `Tile Index: ${tile.decorationTile.index}`;
                } else {
                    decorationLayer.image.setSrc('');
                    decorationLayer.indexText.text = `Tile Index: None`;
                }

                if (tile.stackedObjectTile) {
                    const blobUrl = await createBlobUrlFromImageData(tile.stackedObjectTile.pixelData, 8, 8);
                    stackedObjectLayer.image.setSrc(blobUrl);
                    stackedObjectLayer.indexText.text = `Tile Index: ${tile.stackedObjectTile.index}`;
                } else {
                    stackedObjectLayer.image.setSrc('');
                    stackedObjectLayer.indexText.text = `Tile Index: None`;
                }

                mouse.mouseUp.listenOnce(() => {
                    tileIndicator.backgroundEnabled = false;
                });
            });

            tileIndicator.parentTo(mapImage)

            tiles.push(tile);
        }
    }

    mapSize = new Vector2(tilesX, tilesY);
    mapTiles = tiles;
    
    mapImage.scrolled.listen((delta, mouse) => {
        const mousePosition = mouse.position;

        const prevImageSize = mapImage.sizeAbsolute;
        const newImageSize = prevImageSize.scale(delta > 0 ? 1.2 : 0.8);

        const deltaSizeChange = newImageSize.subtract(prevImageSize);

        const imagePosition = mapImage.positionAbsolute;
        const zoomAnchorPoint = mousePosition.subtract(imagePosition).divide(prevImageSize);

        const zoomOffsetApplied = zoomAnchorPoint.multiply(deltaSizeChange).scale(-1);

        mapImage.positionAbsolute = imagePosition.add(zoomOffsetApplied);
        mapImage.sizeAbsolute = newImageSize;
    });

    let dragStartPosition = null;
    let imageStartPosition = null;

    mapImage.mouseDown.listen((position, mouse) => {
        dragStartPosition = mouse.position.clone();
        imageStartPosition = mapImage.positionAbsolute.clone();
        
        const connection = mouse.mouseMoved.listen(() => {
            const currentMousePosition = mouse.position;
            const totalDelta = currentMousePosition.subtract(dragStartPosition);
            
            mapImage.positionAbsolute = imageStartPosition.add(totalDelta);
        });

        mouse.mouseUp.listenOnce(() => {
            connection.unlisten();
        });
    });

    ui.addObject(mapImage);

    tilesetDrawer.visible = true;
    tileInspector.visible = true;
    exportButton.visible = true;
    importMessage.visible = false;

    updateMapTileIndexData();
}

function onNewTilesetImported (textureSrc, size, textureName, texture) {
    if (size.x % 8 !== 0 || size.y % 8 !== 0) {
        alert("Inalid tileset! Must import tileset in original size with 8px x 8px sized tiles.");
        return;
    }

    const isDecorations = textureName.includes("decorations");

    const tilesX = size.x / 8;
    const tilesY = size.y / 8;

    const tiles = [];
    const tilesetId = tilesetData.length;
    const tilesetObj = {
        name: textureName,
        id: tilesetId,
        tiles: tiles,
        isDecorations,
        size: new Vector2(tilesX, tilesY)
    };

    for (let y = 0; y < tilesY; y++) {
        for (let x = 0; x < tilesX; x++) {
            const tilePixelData = readPartialImageData(texture, x * 8, y * 8, 8, 8);
            const index = y * tilesX + x;

            if (isEmptyPixelData(tilePixelData)) {
                continue;
            }

            const prevTile = tiles[tiles.length - 1];
            const tile = {
                position: new Vector2(x, y),
                index: index,
                pixelData: tilePixelData,
                isVoxel: false,
                ignored: false,
                tileset: tilesetObj
            };

            if (prevTile !== undefined && prevTile.position.y === y && prevTile.position.x === x - 1) {
                if (isUniformColor(prevTile.pixelData)) {
                    tile.isVoxel = true;

                    // should we ignore top tile? not sure? height can be zero
                    const topTile = tiles.find((searchTile) => {
                        return searchTile.position.x == x &&
                            searchTile.position.y == y - 1
                    });

                    if (topTile) {
                        topTile.ignored = true;
                    }
                }
            }
            
            tiles.push(tile);
        }
    }

    tilesetData.push(tilesetObj);

    const currentSize = tilesetContainer.canvasSize;

    const tileset = new UIBase({
        size: new Vector2(0, size.y + 50),
        sizeScale: new Vector2(0.8, 0),
        positionScale: new Vector2(0.5, 0),
        pivot: new Vector2(0.5, 0),
        position: currentSize,
        backgroundColor: '#2563eb',
        transparency: 0.35,
        zIndex: -tilesetContainer.children.length
    });
    tileset.parentTo(tilesetContainer);

    tileset.mouseDown.listen((position, mouse) => {
        tileset.backgroundEnabled = true;

        const connection = mouse.mouseDown.listen((downPosition, mouse, event) => {
            if (tileset.isPointInside(position) || event.shiftKey) {
                return;
            }
            
            tileset.backgroundEnabled = false;
            connection.unlisten();
        });
    });

    const name = new UIText(textureName, {
        positionScale: new Vector2(0.5, 1),
        pivot: new Vector2(0.5, 1),
        size: new Vector2(0, 50),
        sizeScale: new Vector2(0.8, 0),
        fontSize: 13,
    })
    name.parentTo(tileset);
    
    const image = new UIImage(textureSrc, {
        imageSize: new Vector2(size.x, size.y),
        size: new Vector2(size.x, size.y),
        positionScale: new Vector2(0.5, 0),
        pivot: new Vector2(0.5, 0)
    });
    image.parentTo(tileset);
    
    const warning = new UIImage('/assets/images/warning.png', {
        positionScale: new Vector2(0, 1),
        pivot: new Vector2(0, 1),
        imageSize: new Vector2(24, 24),
        size: new Vector2(24, 24),
    });
    warning.parentTo(tileset);

    const message = new UIText("This tileset could not be identified within the map image!", {
        positionScale: new Vector2(0.5, 0.5),
        size: new Vector2(150, 85),
        borderSize: 2,
        backgroundEnabled: true,
        backgroundColor: '#aaaaaa',
        fontSize: 13,
        paddingLeft: 5,
        paddingRight: 5,
        paddingTop: 5,
        paddingBottom: 5,
        zIndex: 100,
        visible: false,
    });
    message.parentTo(warning);
    warning.mouseEnter.listen(() => {
        message.visible = true;
    });
    warning.mouseLeave.listen(() => {
        message.visible = false;
    });

    tilesetContainer.canvasSize = currentSize.add(new Vector2(0, tileset.sizeAbsolute.y));
    updateMapTileIndexData();
}

const listenImageTextureImport = (inputNode, callback) => {
    inputNode.addEventListener("change", async () => {
        if (inputNode.files.length !== 1) {
            return
        }

        const importFile = inputNode.files[0];
        const textureSrc = URL.createObjectURL(importFile);

        const texture = document.createElement("img");
        texture.src = URL.createObjectURL(importFile);

        const [width, height] = await new Promise((resolve) => {
            texture.onload = () => {
                resolve([texture.width, texture.height]);
            };
        });

        callback(textureSrc, { x: width, y: height }, importFile.name.substring(0, importFile.name.lastIndexOf('.')), texture)
    });
}

let lastFrame = Date.now();

function loop () {
    context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const now = Date.now();
    const deltaTime = now - lastFrame;

    ui.update(deltaTime);
    ui.render();

    requestAnimationFrame(loop);
}

listenImageTextureImport(mapImageInput, onNewMapImported);
listenImageTextureImport(tilesetInput, onNewTilesetImported);

loop();