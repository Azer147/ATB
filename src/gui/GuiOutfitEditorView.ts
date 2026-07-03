import { GuiHelper, GuiFormField } from "./GuiHelper";
import GuiViewBase from "./GuiViewBase";
import { allOutfitList, extractOutfitDataFromCode, extractOutfitDataFromId, OutfitId } from "@/models/OutfitSettings";
import { createColorRect, extractCharacterOutfitColor, hslToHex, smartReplaceItemColor } from "@/utility/ColorUtility";
import { isBodyPart } from "@/utility/utility";

export class GuiOutfitEditorView extends GuiViewBase {
    private previewCanva: HTMLCanvasElement | null = null;
    private previewcanvaContext: CanvasRenderingContext2D | null = null;
    private previewChar: Character | undefined;
    private previewResizeObserver: ResizeObserver | null = null;

    // Base canva size from BC.
    private static readonly PREVIEW_BASE_WIDTH = 500;
    private static readonly PREVIEW_BASE_HEIGHT = 1000;
    private static readonly PREVIEW_BASE_X = 0;
    private static readonly PREVIEW_BASE_Y = -20;

    private previewZoom = 1;
    private previewOffsetX = GuiOutfitEditorView.PREVIEW_BASE_X;
    private previewOffsetY = GuiOutfitEditorView.PREVIEW_BASE_Y;

    private UPDATE_PREVIEW_TIME_MS = 100;
    private updatePreviewInterval: number = 0;

    private colorTargetSelect: HTMLElement | null = null;

    private HELP_BASE_TASK_TEXT = `
    TODO
    `;

    private STRINGS = {
        PAGE_TITLE: "TODO",

        HELP_BASE_TASK_TITLE: "TODO",

        BTN_SHOW: "Show"
    };

    private FIELD_OUTFIT_STORED_IMPORT: GuiFormField = {
        html_id: "atb-outfit-stored-import",
        label: "Import ATB Outfit",
        type: "select",
        options: []
    };
    private FIELD_OUTFIT_CODE_IMPORT: GuiFormField = {
        html_id: "atb-outfit-code-import",
        label: "Import Outfit From Code",
        type: "text",
        default_value: ""
    };
    private FIELD_COLOR_TARGET: GuiFormField = {
        html_id: "atb-outfit-color-target",
        label: "Target Color (which color to change)",
        type: "select",
        options: [
            { value: "Default", label: "All" },
        ]
    };


    constructor(parent: HTMLDivElement, C: OtherCharacter | PlayerCharacter) {
        super(parent, C);

        let outfitViewer = document.createElement("div");
        let outfitCards = document.createElement("div");
        this.testOutfitViewer(outfitViewer);
        this.buildOutfitEditorPage(outfitCards);

        let row = GuiHelper.createTwoElemRow(outfitViewer, outfitCards);
        // We want the card to take more space
        outfitCards.style.flex = "2";

        // Make outfitViewer stick
        outfitViewer.style.position = "sticky";
        outfitViewer.style.top = "1.2em"; // The distance from the top of the scrolling container
        outfitViewer.style.alignSelf = "flex-start";

        this.parent.appendChild(row);
    }

    public update() {
    }

    public unload() {
        if (this.updatePreviewInterval) {
            clearInterval(this.updatePreviewInterval);
        }
        if (this.previewResizeObserver) {
            this.previewResizeObserver.disconnect();
            this.previewResizeObserver = null;
        }
        if (this.previewChar) {
            CharacterDelete(this.previewChar);
        }
    }

    private updatePreview() {
        if (this.previewCanva && this.previewcanvaContext && this.previewChar) {
            this.previewcanvaContext.clearRect(0, 0, this.previewCanva.width, this.previewCanva.height);

            // Fix blind issue, If current Player is blind or others effects, DrawCharacter will render a darken/blurry/invisble character.
            const savedEffect = Player.Effect = [];
            DrawCharacter(this.previewChar, this.previewOffsetX, this.previewOffsetY, this.previewZoom, true, this.previewcanvaContext);
            Player.Effect = savedEffect;
        }
    }

    // Update the Canva size based on the container size, and adjust the zoom/offset to keep the same framing.
    // Details: CSS can only control the size of the container,
    //   but the actual drawing buffer resolution is controlled by the width/height attributes of the canvas element.
    //   So we need to update those whenever the container size changes, and also adjust the zoom/offset to keep the same framing.
    private resizePreviewCanvas(width: number, height: number) {
        if (!this.previewCanva || width <= 0 || height <= 0) return;

        const dpr = window.devicePixelRatio || 1;
        this.previewCanva.width = Math.round(width * dpr);
        this.previewCanva.height = Math.round(height * dpr);

        const scale = this.previewCanva.height / GuiOutfitEditorView.PREVIEW_BASE_HEIGHT;
        this.previewZoom = scale;
        this.previewOffsetX = GuiOutfitEditorView.PREVIEW_BASE_X * scale;
        this.previewOffsetY = GuiOutfitEditorView.PREVIEW_BASE_Y * scale;

        this.updatePreview();
    }

    private testOutfitViewer(container: HTMLElement) {
        this.previewCanva = document.createElement("canvas");
        this.previewCanva.style.position = "relative";
        this.previewCanva.style.display = "flex";
        this.previewCanva.style.width = "20em";
        // Prevent stretching
        this.previewCanva.style.aspectRatio = `${GuiOutfitEditorView.PREVIEW_BASE_WIDTH} / ${GuiOutfitEditorView.PREVIEW_BASE_HEIGHT}`;
        this.previewCanva.style.margin = "0";

        this.previewcanvaContext = this.previewCanva.getContext("2d");
        if (!this.previewcanvaContext) {
            console.warn("ATB: DEBUG: Cannot get canvaContext!");
            return;
        }

        // Update the canva size when the container size changes
        this.previewResizeObserver = new ResizeObserver(entries => {
            const entry = entries[0];
            if (entry) this.resizePreviewCanvas(entry.contentRect.width, entry.contentRect.height);
        });
        this.previewResizeObserver.observe(this.previewCanva);

        this.previewChar = CharacterLoadSimple(`ATB-Outfit-Viewer`);
        // To prevent holding nested ref from this.character
        const appearanceStr = CharacterAppearanceStringify(this.character);
        CharacterAppearanceRestore(this.previewChar, appearanceStr);

        // Test fix blind
        //this.previewChar.MemberNumber = this.character.MemberNumber;

        //CharacterNaked(this.previewChar, false);
        //CharacterReleaseTotal(this.previewChar, false);
        CharacterResetFacialExpression(this.previewChar);
        CharacterRefresh(this.previewChar, false, false);

        // Issue: Can't see previewchar if Player is blind..

        //DrawCharacter(this.previewChar, -50, -20, 1, true, this.previewcanvaContext);

        // Need fast interval for animations
        // Note: We could also just DrawCharacter once if needed, if we don't care about animations
        this.updatePreviewInterval = setInterval(() => {this.updatePreview()}, this.UPDATE_PREVIEW_TIME_MS);

        container.appendChild(this.previewCanva);
    }

    private resetPreviewCharAppearance() {
        if (!this.previewChar) return;

        const appearanceStr = CharacterAppearanceStringify(this.character);
        CharacterAppearanceRestore(this.previewChar, appearanceStr);

        CharacterResetFacialExpression(this.previewChar);
        CharacterRefresh(this.previewChar, false, false);
        this.updateTargetColorSelect(this.previewChar);
    }

    private showOutfit(outfitItem: ServerItemBundle[]) {
        if (this.previewChar) {
            CharacterReleaseTotal(this.previewChar, false);
            CharacterNaked(this.previewChar, false);
            CharacterResetFacialExpression(this.previewChar);

            for (let i = 0; i < outfitItem.length; i++) {
                let item = outfitItem[i];

                let appliedItem = InventoryWear(this.previewChar, item.Name, item.Group, item.Color, item.Difficulty, undefined, item.Craft, false);
                if (item.Property && appliedItem) {
                    appliedItem.Property = item.Property;
                }
            }
            CharacterRefresh(this.previewChar, false, false);

            this.updateTargetColorSelect(this.previewChar);
        }
    }

    private updateTargetColorSelect(C: Character) {
        const outfitColor = extractCharacterOutfitColor(C);

        if (this.colorTargetSelect) {
            this.FIELD_COLOR_TARGET.options = [{ value: "Default", label: "All" }]; // Reset options
            for (let i = 0; i < outfitColor.length; i++) {
                this.FIELD_COLOR_TARGET.options.push({ value: outfitColor[i], label: "ColorGroup " + (i + 1) });
            }

            this.colorTargetSelect.innerHTML = ""; // Clear previous field
            let select = GuiHelper.createFormField(this.FIELD_COLOR_TARGET);
            select.querySelector("select")?.addEventListener("change", () => {
                const targetColor = GuiHelper.getFormFieldValue(this.parent, this.FIELD_COLOR_TARGET) as string;
                if (targetColor && targetColor !== "Default") {
                    let elem = this.parent.querySelector("#atb-target-color-rect") as HTMLElement | undefined;
                    if (elem) {
                        elem.style.backgroundColor = targetColor;
                    }
                }
            });
            this.colorTargetSelect.appendChild(select);
        }
    }

    private testChangePreviewCharColor() {
        const colorMainSlider = this.parent.querySelector("#atb-main-color-range") as HTMLInputElement | undefined;
        if (!colorMainSlider) return;
        const newColor = hslToHex(parseInt(colorMainSlider.value), 1, 0.5);

        let targetColor = GuiHelper.getFormFieldValue(this.parent, this.FIELD_COLOR_TARGET) as string;
        if (!targetColor) {
            targetColor = "Default";
        }

        if (this.previewChar && newColor && newColor !== "Default") {
            for (let i = 0; i < this.previewChar.Appearance.length; i++) {
                let item = this.previewChar.Appearance[i];
                if (item.Color && !isBodyPart(item)) {
                    let customColor = smartReplaceItemColor(newColor, item.Color, targetColor);
                    if (customColor && customColor !== "Default") {
                        item.Color = customColor;
                    }
                }
            }
            CharacterRefresh(this.previewChar, false, false);
            this.updateTargetColorSelect(this.previewChar);
        }
    }

    private applyOutfitFromCode() {
        const outfitCode = GuiHelper.getFormFieldValue(this.parent, this.FIELD_OUTFIT_CODE_IMPORT) as string;

        // Extract items from code
        const outfitItems = extractOutfitDataFromCode(outfitCode);
        if (outfitItems.length > 0) {
            this.showOutfit(outfitItems);
        }
    }

    private applyOutfitFromStored() {
        const outfitId = GuiHelper.getFormFieldValue(this.parent, this.FIELD_OUTFIT_STORED_IMPORT) as OutfitId;

        // get Raw Outfit code
        const outfitItems = extractOutfitDataFromId(outfitId);
        if (outfitItems.length > 0) {
            this.showOutfit(outfitItems);
        }
    }

    public buildOutfitEditorPage(container: HTMLElement) {
        const form = document.createElement("div");
        form.style.display = "flex";
        form.style.flexDirection = "column";
        form.style.gap = "0.5em";

        //const helpSection = GuiHelper.createInfoSection("info", this.STRINGS.HELP_BASE_TASK_TITLE, this.HELP_BASE_TASK_TEXT);
        //form.appendChild(helpSection);
        GuiHelper.createContentTitle(form, "Outfit import", true);

        // Populate Outfit Select
        this.FIELD_OUTFIT_STORED_IMPORT.options = [];
        for (let i = 0; i < allOutfitList.length; i++) {
            let outfitData = allOutfitList[i];

            this.FIELD_OUTFIT_STORED_IMPORT.options.push({value: outfitData.id, label: outfitData.name})
        }
        const storedImport = GuiHelper.createFormField(this.FIELD_OUTFIT_STORED_IMPORT);

        // Stored import
        const applyStoredBtn = document.createElement("button");
        applyStoredBtn.className = "atb-main-btn";
        applyStoredBtn.innerText = "Apply Stored Outfit";
        applyStoredBtn.style.maxWidth = "fit-content";
        applyStoredBtn.onclick = () => {
            this.applyOutfitFromStored();
        };
        const storedImportRow = GuiHelper.createTwoElemRow(storedImport, applyStoredBtn);
        form.appendChild(storedImportRow);

        // Code import
        const codeImport = GuiHelper.createFormField(this.FIELD_OUTFIT_CODE_IMPORT);
        const applyCodeBtn = document.createElement("button");
        applyCodeBtn.className = "atb-main-btn";
        applyCodeBtn.innerText = "Apply Outfit Code";
        applyStoredBtn.style.maxWidth = "fit-content";
        applyCodeBtn.onclick = () => {
            this.applyOutfitFromCode();
        };
        const codeImportRow = GuiHelper.createTwoElemRow(codeImport, applyCodeBtn);
        form.appendChild(codeImportRow);

        // Reset btn
        const resetBtn = document.createElement("button");
        resetBtn.className = "atb-main-btn";
        resetBtn.innerText = "Reset Outfit";
        resetBtn.onclick = () => {
            this.resetPreviewCharAppearance();
        };
        form.appendChild(resetBtn);


        // Color editor
        GuiHelper.createContentTitle(form, "Color editor", false);

        // Select color
        const colorMain = document.createElement("div");
        const colorMainRect = createColorRect("atb-main-color-rect", "#ffffff");
        const colorMainSlider = document.createElement("input");
        colorMainSlider.id = "atb-main-color-range"; // should be a variable
        colorMainSlider.className = "atb-hue-slider";
        colorMainSlider.type = "range";
        colorMainSlider.min = "0";
        colorMainSlider.max = "360";
        colorMainSlider.onchange = () => {
            const hexValue = hslToHex(parseInt(colorMainSlider.value), 1, 0.5);
            colorMainRect.style.backgroundColor = hexValue;
        };
        colorMain.appendChild(colorMainSlider);
        form.appendChild(colorMain);
        form.appendChild(colorMainRect);

        // Target color
        this.colorTargetSelect = document.createElement("div");
        this.colorTargetSelect.appendChild(GuiHelper.createFormField(this.FIELD_COLOR_TARGET));
        form.appendChild(this.colorTargetSelect);
        form.appendChild(createColorRect("atb-target-color-rect", "#ffffff"));

        const changeColorBtn = document.createElement("button");
        changeColorBtn.className = "atb-main-btn";
        changeColorBtn.innerText = "Change Outfit Color";
        changeColorBtn.onclick = () => {
            this.testChangePreviewCharColor();
        };
        form.appendChild(changeColorBtn);


        // Cloth / Item manipulation
        GuiHelper.createContentTitle(form, "Cloth / Item Manipulation", false);

        const nakedBtn = document.createElement("button");
        nakedBtn.className = "atb-main-btn";
        nakedBtn.innerText = "Naked";
        nakedBtn.onclick = () => {
            if (this.previewChar) {
                CharacterNaked(this.previewChar, false);
                CharacterRefresh(this.previewChar, false, false);
            }
        };
        //form.appendChild(nakedBtn);

        const untieBtn = document.createElement("button");
        untieBtn.className = "atb-main-btn";
        //untieBtn.style.marginTop = "0.5em";
        untieBtn.innerText = "Untie";
        untieBtn.onclick = () => {
            if (this.previewChar) {
                CharacterReleaseTotal(this.previewChar, false);
                CharacterRefresh(this.previewChar, false, false);
            }
        };
        //form.appendChild(untieBtn);

        const itemRow = GuiHelper.createTwoElemRow(nakedBtn, untieBtn);
        form.appendChild(itemRow);

        // Apply Outfit to character
        GuiHelper.createContentTitle(form, "Apply Current Outfit to Character", false);

        const applyToCharBtn = document.createElement("button");
        applyToCharBtn.className = "atb-main-btn";
        applyToCharBtn.innerText = "Apply to Character";
        applyToCharBtn.onclick = () => {
            if (this.previewChar) {
                const appearanceStr = CharacterAppearanceStringify(this.previewChar);
                CharacterAppearanceRestore(this.character, appearanceStr);

                CharacterResetFacialExpression(this.character);
                CharacterRefresh(this.character, true, false);
                ChatRoomCharacterUpdate(this.character);
            }
        };
        form.appendChild(applyToCharBtn);

        container.appendChild(form);
        if (this.previewChar) {
            this.updateTargetColorSelect(this.previewChar);
        }
    }
}