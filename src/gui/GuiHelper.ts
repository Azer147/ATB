
export interface GuiFormField {
    html_id: string;
    label: string;
    //descrption: string; // not sure needed (for now helper is not per field)
    type: "number" | "checkbox" | "select" | "text" | "display-text";

    // for all except select
    default_value?: number | boolean | string;

    // for number type
    min_value?: number;
    max_value?: number;

    // for select type
    options?: {value: string, label: string}[];

    // optional for checkbox
    // true to make the checkbox padding bigger to align with an input/select on the same row
    useInputPadding?: boolean;

    // optional for displayText
    usePrimaryColor?: boolean;

    onChange?: (value: any) => void;
}

export interface GuiDialogButton {
    label: string;
    onClick: () => void;
    isPrimary?: boolean; // Use primary colors
}

export class GuiHelper {

    public static createContentTitle(parent: HTMLElement, text: string, removePaddingTop: boolean = false) {
        const title = document.createElement("h3");
        title.className = "atb-content-title";
        title.innerText = text;
        if (removePaddingTop) {
            // In case the title is at the top of the page
            title.style.paddingTop = "0";
        }
        parent.appendChild(title);
    }

    public static createTwoElemRow(elem1: HTMLElement | undefined, elem2: HTMLElement | undefined): HTMLDivElement {
        const row = document.createElement("div");
        row.style.display = "flex";
        row.style.gap = "15px";

        // Create empty div if elem undefined to keep spacing correct
        if (!elem1) elem1 = document.createElement("div");
        if (!elem2) elem2 = document.createElement("div");

        elem1.style.flex = "1";
        elem2.style.flex = "1";
        row.appendChild(elem1);
        row.appendChild(elem2);
        return row;
    }

    public static createFormField(field: GuiFormField): HTMLElement {
        switch (field.type) {
            case "number":
                return this.createNumberInput(field.html_id, field.label, field.default_value as number, field.min_value ?? 0, field.max_value ?? 10000, field.onChange);
            case "checkbox":
                return this.createCheckbox(field.html_id, field.label, field.default_value as boolean, field.useInputPadding ?? false, field.onChange);
            case "select":
                return this.createSelect(field.html_id, field.label, field.options ?? [], field.onChange);
            case "display-text":
                return this.createTextDisplay(field.html_id, field.label, field.usePrimaryColor);
            //case "text":
                // TODO
            default:
                const error = document.createElement("span");
                error.innerText = `Unsupported field type: ${field.type}`;
                error.style.color = "red";
                return error;
        }
    }

    public static getFormFieldValue(container: HTMLElement, field: GuiFormField): number | boolean | string | null {
        const elem = container.querySelector(`#${field.html_id}`);
        if (!elem) {
            console.error(`Element with ID '${field.html_id}' not found`);
            return null;
        }

        // TODO: validate value here ?

        switch (field.type) {
            case "number":
                return parseFloat((elem as HTMLInputElement).value);
            case "checkbox":
                return (elem as HTMLInputElement).checked;
            case "select":
                return (elem as HTMLSelectElement).value;
            default:
                console.error(`ATB: Error: Unsupported field type: ${field.type}`);
                return null;
        }
    }

    public static createCheckbox(htmlId: string, labelText: string, defaultValue: boolean, useInputPadding: boolean, onChange?: (value: boolean) => void): HTMLElement {
        const checkboxWrapper = document.createElement("label");
        checkboxWrapper.className = "atb-checkbox-label";

        if (useInputPadding) {
            // Push the checkbox down slightly so it aligns with the input box size (which is quite bigger)
            checkboxWrapper.style.paddingTop = "20px";
        }

        const checkboxInput = document.createElement("input");
        checkboxInput.id = htmlId;
        checkboxInput.type = "checkbox";
        checkboxInput.className = "atb-form-checkbox";
        checkboxInput.checked = defaultValue;
        if (onChange) {
            checkboxInput.addEventListener("change", () => onChange(checkboxInput.checked));
        }

        checkboxWrapper.appendChild(checkboxInput);
        checkboxWrapper.appendChild(document.createTextNode(labelText));

        return checkboxWrapper;
    }

    public static createNumberInput(htmlId: string, labelText: string, defaultValue: number, min: number, max: number, onChange?: (value: number) => void): HTMLDivElement {
        const wrapper = document.createElement("div");
        wrapper.className = "atb-form-group";

        const label = document.createElement("label");
        label.className = "atb-form-label";
        label.innerText = labelText;

        const input = document.createElement("input");
        input.id = htmlId;
        input.className = "atb-form-input";
        input.type = "number";
        input.value = defaultValue.toString();
        input.min = min.toString();
        input.max = max.toString();
        if (!Number.isInteger(min) || !Number.isInteger(max) || !Number.isInteger(defaultValue)) {
            input.step = "0.1";
        }

        if (onChange) {
            input.addEventListener("change", () => {
                let value = parseFloat(input.value);
                if (value < min) {
                    value = min
                } else if (value > max) {
                    value = max;
                }
                onChange(value)
            });
        }

        wrapper.appendChild(label);
        wrapper.appendChild(input);
        return wrapper;
    }

    public static createSelect(htmlId: string, labelText: string, options: {value: string, label: string}[], onChange?: (value: string) => void): HTMLDivElement {
        const wrapper = document.createElement("div");
        wrapper.className = "atb-form-group";

        const label = document.createElement("label");
        label.className = "atb-form-label";
        label.innerText = labelText;

        const select = document.createElement("select");
        select.className = "atb-form-input";
        select.id = htmlId;

        options.forEach(opt => {
            const optionEl = document.createElement("option");
            optionEl.value = opt.value;
            optionEl.innerText = opt.label;
            select.appendChild(optionEl);
        });

        if (onChange) {
            select.addEventListener("change", () => onChange(select.value));
        }

        wrapper.appendChild(label);
        wrapper.appendChild(select);
        return wrapper;
    }

    public static createTextDisplay(htmlId: string, labelText: string, usePrimaryColor: boolean = false): HTMLDivElement {
        let color = "var(--atb-text-secondary)";
        if (usePrimaryColor) {
            color = "var(--atb-primary)";
        }

        const textDisplay = document.createElement("div");
        textDisplay.id = htmlId;
        textDisplay.style.fontSize = "1.1em";
        textDisplay.style.color = color;
        textDisplay.style.fontWeight = "bold";
        textDisplay.style.textAlign = "center";
        textDisplay.style.alignContent = "center";
        textDisplay.style.borderRadius = "6px";
        textDisplay.style.border = "1px solid " + color;
        textDisplay.innerText = labelText;

        return textDisplay;
    }

    public static createHelpSection(title: string, contentHtml: string): HTMLDivElement {
        const wrapper = document.createElement("div");
        wrapper.className = "atb-help-section";

        const header = document.createElement("div");
        header.className = "atb-help-header";

        const titleSpan = document.createElement("span");
        //titleSpan.innerHTML = `ℹ️ <strong>${title}</strong>`;
        titleSpan.innerHTML = `ℹ️ ${title}`;

        const arrowSpan = document.createElement("span");
        arrowSpan.className = "atb-help-arrow";
        arrowSpan.innerText = "▼";

        header.appendChild(titleSpan);
        header.appendChild(arrowSpan);

        const content = document.createElement("div");
        content.className = "atb-help-content";
        content.style.display = "none";
        content.innerHTML = contentHtml;

        // Toggle logic
        header.onclick = () => {
            const isExpanded = content.style.display === "block";
            content.style.display = isExpanded ? "none" : "block";
            arrowSpan.style.transform = isExpanded ? "rotate(0deg)" : "rotate(180deg)";
        };

        wrapper.appendChild(header);
        wrapper.appendChild(content);

        return wrapper;
    }

    public static showDialog(container: HTMLElement, title: string, htmlDescription: string, buttons: GuiDialogButton[]) {
        // Backdrop
        const backdrop = document.createElement("div");
        backdrop.className = "atb-dialog-backdrop";

        // Block click events below
        const blockEvent = (e: Event) => e.stopPropagation();
        backdrop.addEventListener("mousedown", blockEvent);
        backdrop.addEventListener("touchstart", blockEvent);
        backdrop.addEventListener("click", blockEvent);

        // Main dialog box
        const box = document.createElement("div");
        box.className = "atb-dialog-box";

        const titleEl = document.createElement("h3");
        titleEl.className = "atb-dialog-title";
        titleEl.innerText = title;

        const textEl = document.createElement("p");
        textEl.className = "atb-dialog-text";
        textEl.innerHTML = htmlDescription;

        // Buttons
        const btnContainer = document.createElement("div");
        btnContainer.className = "atb-dialog-buttons";

        buttons.forEach(btnConfig => {
            const btn = document.createElement("button");

            if (btnConfig.isPrimary) {
                btn.className = "atb-main-btn";
            } else {
                btn.className = "atb-action-btn";
            }

            btn.innerText = btnConfig.label;

            btn.onclick = () => {
                backdrop.remove();
                btnConfig.onClick();
            };

            btnContainer.appendChild(btn);
        });

        // Final assembly
        box.appendChild(titleEl);
        box.appendChild(textEl);
        box.appendChild(btnContainer);
        backdrop.appendChild(box);

        container.appendChild(backdrop);
    }

    public static createFeatureToggleCard(field: GuiFormField, useContentArea: boolean, rightSideElem?: HTMLElement): { card: HTMLDivElement, contentArea: HTMLDivElement } {
        if (field.type !== "checkbox" && field.type !== "display-text") {
            console.warn("ATB: createFeatureToggleCard requires a checkbox or display-text GuiFormField.");
        }
        const isEnabled = !!field.default_value;
        let isExpanded = false;

        const card = document.createElement("div");
        card.className = `atb-feature-card ${isEnabled ? "is-enabled" : ""}`;
        if (rightSideElem) card.style.padding = "8px"; // lower padding when using rightSideElem

        // Row: Header
        const header = document.createElement("div");
        header.className = "atb-feature-header";

        // Left side of the header: Expand Icon + Checkbox
        const headerLeft = document.createElement("div");
        headerLeft.style.display = "flex";
        headerLeft.style.alignItems = "center";
        headerLeft.style.gap = "30px";

        // Expand/Collapse Icon (+/-)
        const expandIcon = document.createElement("span");
        expandIcon.style.cursor = "pointer";
        expandIcon.style.fontWeight = "bold";
        expandIcon.style.fontSize = "1.2em";
        expandIcon.style.color = "var(--atb-text-muted)";
        expandIcon.style.userSelect = "none";
        expandIcon.style.display = useContentArea ? "inline-block" : "none"; // Hide if no content
        expandIcon.innerText = isExpanded ? "-" : "+";

        // The Main Checkbox
        let checkboxInput;
        let checkboxWrapper: HTMLElement;
        if (field.type == "checkbox") {
            checkboxWrapper = this.createCheckbox(field.html_id, field.label, isEnabled, false);
            checkboxInput = checkboxWrapper.querySelector("input") as HTMLInputElement;
        } else { // display-text
            checkboxWrapper = document.createElement("div");
            checkboxWrapper.className = "atb-checkbox-label";
            checkboxWrapper.innerText = field.label;
        }
        checkboxWrapper.style.fontSize = "1.1em";
        checkboxWrapper.style.fontWeight = "bold";

        headerLeft.appendChild(expandIcon);
        headerLeft.appendChild(checkboxWrapper);

        // Right side of the header: Status
        let statusText;
        if (!rightSideElem) {
            statusText = document.createElement("span");
            statusText.className = "atb-feature-status";
            statusText.innerText = isEnabled ? "Enabled" : "Disabled";
            rightSideElem = statusText;
        }

        header.appendChild(headerLeft);
        header.appendChild(rightSideElem as HTMLElement);

        // contentArea
        const contentArea = document.createElement("div");
        contentArea.className = "atb-feature-content";
        contentArea.style.display = isExpanded ? "flex" : "none";

        // Helper to handle visual expansion/collapse
        const updateExpandedState = (expand: boolean) => {
            if (!useContentArea) return;
            isExpanded = expand;
            contentArea.style.display = isExpanded ? "flex" : "none";
            expandIcon.innerText = isExpanded ? " - " : " + ";
        };

        // Manual Expand/Collapse via the +/- icon
        expandIcon.addEventListener("click", () => {
            updateExpandedState(!isExpanded);
        });

        // Update style & auto-expand/collapse on Checkbox toggle
        if (checkboxInput) {
            checkboxInput.addEventListener("change", () => {
                const checked = checkboxInput.checked;

                if (checked) {
                    card.classList.add("is-enabled");
                    if (statusText) statusText.innerText = "Enabled";
                    updateExpandedState(true); // Auto-expand when enabled
                } else {
                    card.classList.remove("is-enabled");
                    if (statusText) statusText.innerText = "Disabled";
                    updateExpandedState(false); // Auto-collapse when disabled
                }

                if (field.onChange) {
                    field.onChange(checked);
                }
            });
        }

        // Final Assembly
        card.appendChild(header);
        card.appendChild(contentArea);

        return { card, contentArea };
    }

    public static buildErrorPage(parent: HTMLElement) {
        parent.innerHTML = "";
        GuiHelper.createContentTitle(parent, "Remote Access Denied", true);
        const text = document.createElement("p");
        text.style.color = "var(--atb-text-muted)";
        text.innerText = "This user don't allow access to these settings.";
        parent.appendChild(text);
    }
}