import { GuiHelper } from "./GuiHelper";
import GuiViewBase from "./GuiViewBase";
import { getAtbVersion } from "..";

export class GuiAboutView extends GuiViewBase {

    private LATEST_CHANGELOG_TEXT = `
        First ever Demo/Alpha version!<br>
    `;

    private FEATURE_IDEAS_TEXT = `
        Here is the list of some of my ideas i have for the next features:<br>
        - More Punishements. <strong>(I need more ideas for this)</strong>.<br>
        - Task Random Activity (similar to Pose Control but with activities)<br>
        - Task Talk Control (i'm not sure on specifics yet)<br>
        - Task Time Enforcement: Player need to be connected/Not connected at certain times (real time) or get penalty.<br>
        - Task Don't Cheat: Give penalty if the player attempt to cheat/safeword or use certain commands<br>
        - Task Finish Condition: Give X Orgasm to other player.<br>
        - Task Finish Condition: Lick/Kiss other people body part X time.<br>
        - Some sort of Escape Challenge as a Task or Finish condition.(not sure how to do that yet)<br>
        <br>
        - Reward Shop to spend Reward Points, with Clothes/Outfit (Outfit code), maybe Skills Boost, maybe LSCG Spells, ... <strong>(I need more ideas for this)</strong>.<br>
        - Locking the base Reward points settings to prevent cheating Reward Points to Spend in the Reward Shop.<br>
        <br>
        - More Outfits<br>
        - More Random Events (need ideas)<br>
        - More events for Devious Shocks (need ideas)<br>
        - A way to Export/Import a task or a list of tasks.<br>
        - BCX Rules violations gives Penalty points<br>
        <br>
        <strong>Disclaimer:</strong> All of this can be changed, cancelled and will probably not be done in that order.
    `;

    private STRINGS = {
        PAGE_TITLE: "Azer Toy Box - About",

        CHANGELOG_TITLE: "Latest Changelog",
        IDEAS_TITLE: "Next Features Ideas",

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
        form.style.gap = "0.9em";

        const changelog = GuiHelper.createInfoSection("info", this.STRINGS.CHANGELOG_TITLE, this.LATEST_CHANGELOG_TEXT);
        form.appendChild(changelog);
        const ideas = GuiHelper.createInfoSection("info", this.STRINGS.IDEAS_TITLE, this.FEATURE_IDEAS_TEXT);
        form.appendChild(ideas);

        // Contacts Card
        const contactCard = GuiHelper.createGenericCard(this.STRINGS.LABEL_CONTACT, "regular", true);
        contactCard.style.display = "flex";
        contactCard.style.flexDirection = "column";
        contactCard.style.gap = "0.7em";

        // Contact
        const discordContact = document.createElement("span");
        discordContact.innerHTML = `Find me on BC Discord: <strong style="color: var(--atb-primary, #4da6ff); user-select: text;">azer14783</strong>`;
        contactCard.appendChild(discordContact);

        // Links Card
        const linkCard = GuiHelper.createGenericCard(this.STRINGS.LABEL_LINK, "regular", true);
        linkCard.style.display = "flex";
        linkCard.style.flexDirection = "column";
        linkCard.style.gap = "0.7em";

        // Link Helper
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
        versionCard.style.gap = "0.7em";

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