import { GuiHelper } from "./GuiHelper";
import GuiViewBase from "./GuiViewBase";
import { getAtbVersion } from "..";

export class GuiAboutView extends GuiViewBase {

    private LATEST_CHANGELOG_TEXT = `
        TODO
    `;

    private STRINGS = {
        PAGE_TITLE: "Azer Toy Box - About",

        CHANGELOG_TITLE: "Latest Changelog",

        LABEL_CONTACT: "Contacts",
        LABEL_LINK: "Links",
        LABEL_VERSION: "Addon Version"
    };

    constructor(parent: HTMLDivElement, C: OtherCharacter | PlayerCharacter) {
        super(parent, C);

        this.buildGeneralPage();
    }

    public update() {}

    public unload() {
    }

    public buildGeneralPage() {
        GuiHelper.createContentTitle(this.parent, this.STRINGS.PAGE_TITLE, true);

        const form = document.createElement("div");
        form.style.display = "flex";
        form.style.flexDirection = "column";
        form.style.gap = "15px";

        const changelog = GuiHelper.createInfoSection("info", this.STRINGS.CHANGELOG_TITLE, this.LATEST_CHANGELOG_TEXT);
        form.appendChild(changelog);

        // Contacts Card
        const contactCard = GuiHelper.createGenericCard(this.STRINGS.LABEL_CONTACT, "regular", true);
        contactCard.style.display = "flex";
        contactCard.style.flexDirection = "column";
        contactCard.style.gap = "12px";

        // Example Contact
        const discordContact = document.createElement("span");
        discordContact.innerHTML = `Find me on BC Discord: <strong style="color: var(--atb-primary, #4da6ff); user-select: text;">azer14783</strong>`;
        contactCard.appendChild(discordContact);


        // Links Card
        const linkCard = GuiHelper.createGenericCard(this.STRINGS.LABEL_LINK, "regular", true);
        linkCard.style.display = "flex";
        linkCard.style.flexDirection = "column";
        linkCard.style.gap = "12px";

        // Example Link Helper
        const createLink = (label: string, url: string) => {
            const anchor = document.createElement("a");
            anchor.href = url;
            anchor.innerText = label;
            anchor.target = "_blank"; // Opens in a new tab
            anchor.style.color = "var(--atb-primary, #4da6ff)";
            anchor.style.textDecoration = "none";
            anchor.addEventListener("mouseenter", () => anchor.style.textDecoration = "underline");
            anchor.addEventListener("mouseleave", () => anchor.style.textDecoration = "none");
            return anchor;
        };

        linkCard.appendChild(createLink("GitHub Repository", "https://github.com/Azer147/ATB"));

        // Version Card
        const versionCard = GuiHelper.createGenericCard(this.STRINGS.LABEL_VERSION, "regular", true);
        versionCard.style.display = "flex";
        versionCard.style.flexDirection = "column";
        versionCard.style.gap = "12px";

        const version = document.createElement("span");
        version.innerHTML = `Version: <strong style="color: var(--atb-primary, #4da6ff); user-select: text;">${getAtbVersion()}</strong>`;
        versionCard.appendChild(version);

        // Final Assembly
        const row1 = GuiHelper.createTwoElemRow(contactCard, linkCard);
        const row2 = GuiHelper.createTwoElemRow(versionCard, undefined);
        form.appendChild(row1);
        form.appendChild(row2);

        this.parent.appendChild(form);
    }
}