

export default abstract class GuiViewBase {
    parent: HTMLDivElement;
    character: OtherCharacter | PlayerCharacter;

    constructor(parent: HTMLDivElement, C: OtherCharacter | PlayerCharacter) {
        this.parent = parent;
        this.character = C;
    }

    public abstract update();

    public abstract unload();

}