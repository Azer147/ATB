
// Helper class to Draw a Character (outside of the main BC's canva)
// Handle All drawing and sizing

/*
// Usage Example:
const viewer = new GuiCharacterViewer(character);
parent_container.appendChild(viewer.getElement());

// At minimum: Need to be called whenever the character visual changes
// Optimally: Should be called at least every 100ms to display correctly BC's/items animations
viewer.updateCharView();

// Optional if you need to change the character drawn:
viewer.setCharacter(newCharacter);

// Don't forget to call unload() when the viewer is no longer needed
viewer.unload();
*/
export class GuiCharacterViewer {
    private character: Character;
    private canva: HTMLCanvasElement;
    private canvaContext: CanvasRenderingContext2D | null = null;
    private resizeObserver: ResizeObserver | null = null;

    // Base canva size from BC.
    private static readonly PREVIEW_BASE_WIDTH = 500;
    private static readonly PREVIEW_BASE_HEIGHT = 1000;
    private static readonly PREVIEW_BASE_X = 0;
    private static readonly PREVIEW_BASE_Y = -20;

    private previewZoom = 1;
    private previewOffsetX = GuiCharacterViewer.PREVIEW_BASE_X;
    private previewOffsetY = GuiCharacterViewer.PREVIEW_BASE_Y;

    constructor(character: Character) {
        this.character = character;
        this.canva = document.createElement("canvas");
        this.createChracterView();
    }

    public getElement(): HTMLCanvasElement {
        return this.canva;
    }
    public setCharacter(character: Character) {
        this.character = character;
        this.updateCharView();
    }

    public unload() {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }
    }

    public updateCharView() {
        if (this.canva && this.canvaContext && this.character) {
            this.canvaContext.clearRect(0, 0, this.canva.width, this.canva.height);

            // Tentative to fix blind issue, If current Player is blind or others effects, DrawCharacter will render a darken/blurry/invisble character.
            const savedEffect = Player.Effect;
            Player.Effect = [];
            DrawCharacter(this.character, this.previewOffsetX, this.previewOffsetY, this.previewZoom, true, this.canvaContext);
            Player.Effect = savedEffect;
        }
    }

    // Create a canva to draw the character
    private createChracterView() {
        this.canva.style.position = "relative";
        this.canva.style.display = "flex";
        this.canva.style.width = "20em";
        // Prevent stretching
        this.canva.style.aspectRatio = `${GuiCharacterViewer.PREVIEW_BASE_WIDTH} / ${GuiCharacterViewer.PREVIEW_BASE_HEIGHT}`;
        this.canva.style.margin = "0";

        this.canvaContext = this.canva.getContext("2d");
        if (!this.canvaContext) {
            console.warn("ATB: DEBUG: Cannot get canvaContext!");
            return;
        }

        // Update the canva size when the container size changes
        this.resizeObserver = new ResizeObserver(entries => {
            const entry = entries[0];
            if (entry) this.resizePreviewCanvas(entry.contentRect.width, entry.contentRect.height);
        });
        this.resizeObserver.observe(this.canva);
    }

    // Update the Canva size based on the container size, and adjust the zoom/offset to keep the same framing.
    // Details: CSS can only control the size of the container,
    //   but the actual drawing buffer resolution is controlled by the width/height attributes of the canvas element.
    //   So we need to update those whenever the container size changes, and also adjust the zoom/offset to keep the same framing.
    private resizePreviewCanvas(width: number, height: number) {
        if (!this.canva || width <= 0 || height <= 0) return;

        const dpr = window.devicePixelRatio || 1;
        this.canva.width = Math.round(width * dpr);
        this.canva.height = Math.round(height * dpr);

        const scale = this.canva.height / GuiCharacterViewer.PREVIEW_BASE_HEIGHT;
        this.previewZoom = scale;
        this.previewOffsetX = GuiCharacterViewer.PREVIEW_BASE_X * scale;
        this.previewOffsetY = GuiCharacterViewer.PREVIEW_BASE_Y * scale;

        this.updateCharView();
    }
}