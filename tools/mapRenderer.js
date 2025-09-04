export const MapRenderer = (function () {
    return class MapRenderer {
        constructor (canvas) {
            this.canvas = canvas;
            this.context = canvas.getContext("2d");
        
            this.scale = 1;
            this.texture = null;
            this.size = null;
        }

        setTexture (texture, size) {
            this.texture = texture;
            this.size = size;
        }

        render () {
            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

            if (this.texture === null) {
                return;
            }

            this.context.drawImage(
                this.texture,
                0, 0,
                this.size.x, this.size.y,
                0, 0,
                this.size.x * this.scale, this.size.y * this.scale
            );
        }
    };
})();