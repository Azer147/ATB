
export interface GuiFormField {
    html_id: string;
    label: string;
    description?: string;

    type: "number" | "checkbox" | "select" | "text" | "display-text";

    // for all except select
    default_value?: number | boolean | string;

    // for number type
    min_value?: number;
    max_value?: number;

    // for select type
    options?: {value: string, label: string}[];

    // for text
    max_length?: number;

    // optional for checkbox
    // true to make the checkbox padding bigger to align with an input/select on the same row
    useInputPadding?: boolean;

    // optional for displayText
    usePrimaryColor?: boolean;

    // optional: assume false if not filled
    disable?: boolean,

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
        row.style.gap = "0.9em";

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
                const minValue = field.min_value ?? 0;
                const defaultNumValue = typeof field.default_value === "number" ? field.default_value : 0;
                return this.createNumberInput(field.html_id, field.label, field.description, defaultNumValue, minValue, field.max_value ?? 10000, field.disable ?? false, field.onChange);
            case "checkbox":
                const defaultBoolValue = typeof field.default_value === "boolean" ? field.default_value : false;
                return this.createCheckbox(field.html_id, field.label, field.description, defaultBoolValue, field.useInputPadding ?? false, field.disable ?? false, field.onChange);
            case "select":
                const defaultSelectValue = typeof field.default_value === "string" ? field.default_value : "";
                return this.createSelect(field.html_id, field.label, field.description, defaultSelectValue, field.options ?? [], field.disable ?? false, field.onChange);
            case "text":
                const defaultTextValue = typeof field.default_value === "string" ? field.default_value : "";
                return this.createTextInput(field.html_id, field.label, field.description, defaultTextValue, field.max_length, field.disable ?? false, field.onChange);
            case "display-text":
                return this.createTextDisplay(field.html_id, field.label, field.usePrimaryColor);
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
            case "text":
                return (elem as HTMLInputElement).value;
            default:
                console.error(`ATB: Error: Unsupported field type: ${field.type}`);
                return null;
        }
    }

    public static createCheckbox(htmlId: string, labelText: string, description: string | undefined, defaultValue: boolean, useInputPadding: boolean, disable: boolean, onChange?: (value: boolean) => void): HTMLElement {
        const checkboxWrapper = document.createElement("label");
        checkboxWrapper.className = "atb-checkbox-label";

        if (useInputPadding) {
            // Push the checkbox down slightly so it aligns with the input box size (which is quite bigger)
            checkboxWrapper.style.paddingTop = "1.2em";
        }

        const checkboxInput = document.createElement("input");
        checkboxInput.id = htmlId;
        checkboxInput.type = "checkbox";
        checkboxInput.className = "atb-form-checkbox";
        checkboxInput.checked = defaultValue;
        checkboxInput.disabled = disable;
        if (!disable && onChange) {
            checkboxInput.addEventListener("change", () => onChange(checkboxInput.checked));
        }

        checkboxWrapper.appendChild(checkboxInput);
        //checkboxWrapper.appendChild(document.createTextNode(labelText));

        // Handle alignement with the tooltip
        const textSpan = document.createElement("span");
        textSpan.innerText = labelText;
        checkboxWrapper.appendChild(textSpan);

        if (description) {
            checkboxWrapper.appendChild(this.createTooltip(description));
        }

        return checkboxWrapper;
    }

    public static createNumberInput(htmlId: string, labelText: string, description: string | undefined, defaultValue: number, min: number, max: number, disable: boolean, onChange?: (value: number) => void): HTMLDivElement {
        const wrapper = document.createElement("div");
        wrapper.className = "atb-form-group";

        const label = document.createElement("label");
        label.className = "atb-form-label";
        label.innerText = labelText;

        if (description) {
            label.appendChild(this.createTooltip(description));
        }

        const input = document.createElement("input");
        input.id = htmlId;
        input.className = "atb-form-input";
        input.type = "number";
        input.value = defaultValue.toString();
        input.min = min.toString();
        input.max = max.toString();
        input.disabled = disable;
        if (!Number.isInteger(min) || !Number.isInteger(max) || !Number.isInteger(defaultValue)) {
            input.step = "0.1";
        }

        if (!disable && onChange) {
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

    public static createSelect(htmlId: string, labelText: string, description: string | undefined, defaultValue: string, options: {value: string, label: string}[], disable: boolean, onChange?: (value: string) => void): HTMLDivElement {
        const wrapper = document.createElement("div");
        wrapper.className = "atb-form-group";

        const label = document.createElement("label");
        label.className = "atb-form-label";
        label.innerText = labelText;

        if (description) {
            label.appendChild(this.createTooltip(description));
        }

        const select = document.createElement("select");
        select.className = "atb-form-input";
        select.id = htmlId;

        let isDefaultValueValid = false;
        options.forEach(opt => {
            const optionEl = document.createElement("option");
            optionEl.value = opt.value;
            optionEl.innerText = opt.label;
            select.appendChild(optionEl);

            // Also check if default value exist in options
            if (defaultValue == opt.value) isDefaultValueValid = true;
        });

        if (isDefaultValueValid) {
            select.value = defaultValue;
        }

        select.disabled = disable;

        if (!disable && onChange) {
            select.addEventListener("change", () => onChange(select.value));
        }

        wrapper.appendChild(label);
        wrapper.appendChild(select);
        return wrapper;
    }

    public static createTextInput(htmlId: string, labelText: string, description: string | undefined, defaultValue: string, maxLength: number | undefined, disable: boolean, onChange?: (value: string) => void): HTMLDivElement {
        const wrapper = document.createElement("div");
        wrapper.className = "atb-form-group";

        const label = document.createElement("label");
        label.className = "atb-form-label";
        label.innerText = labelText;

        if (description) {
            label.appendChild(this.createTooltip(description));
        }

        const input = document.createElement("input");
        input.id = htmlId;
        input.className = "atb-form-input";
        input.type = "text";
        input.value = defaultValue.toString();
        input.disabled = disable;

        if (maxLength !== undefined) {
            input.maxLength = maxLength;
        }

        if (!disable && onChange) {
            input.addEventListener("change", () => {
                onChange(input.value)
            });
        }

        wrapper.appendChild(label);
        wrapper.appendChild(input);
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

    public static createTooltip(description: string): HTMLSpanElement {
        const wrapper = document.createElement("span");
        wrapper.className = "atb-tooltip";
        // Help icon from heroicons.com
        wrapper.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
            </svg>
        `;

        const text = document.createElement("span");
        text.className = "atb-tooltip-text";
        text.innerText = description;

        // Prevent tooltip to overflow to one side or the other
        const adjustPosition = () => {
            // Initial position
            text.style.left = "50%";
            text.style.right = "auto";
            text.style.transform = "translateX(-50%)";

            const textRect = text.getBoundingClientRect();
            // Maybe not a good idea to hardcode it, but i'm lazy to add a new arg everywhere for it
            const container = wrapper.closest('.atb-content-area');
            if (!container) return; // Shouldn't happen
            const containerRect = container.getBoundingClientRect();
            const padding = 15; // Safe distance from edge

            let shiftX = 0;

            // Check if overflowing
            if (textRect.right > containerRect.right - padding) {
                shiftX = (containerRect.right - padding) - textRect.right;
            } else if (textRect.left < containerRect.left + padding) {
                shiftX = (containerRect.left + padding) - textRect.left;
            }

            // Shift accordingly if an overflow occured
            if (shiftX !== 0) {
                text.style.transform = `translateX(calc(-50% + ${shiftX}px))`;
            }
        };

        // Hover
        wrapper.addEventListener("mouseenter", adjustPosition);
        wrapper.addEventListener("mouseleave", () => {
            text.classList.remove("visible");
        });

        // For mobile: Toggle on click
        wrapper.addEventListener("click", (e) => {
            // Prevent click to also activate a checkbox
            e.preventDefault();
            e.stopPropagation();

            document.querySelectorAll('.atb-tooltip-text.visible').forEach(el => {
                if (el !== text) el.classList.remove('visible');
            });

            if (!text.classList.contains("visible")) {
                adjustPosition();
            }

            text.classList.toggle("visible");
        });

        wrapper.appendChild(text);
        return wrapper;
    }

    public static createInfoSection(type: "info" | "warning" | "error", title: string, contentHtml?: string): HTMLDivElement {
        const wrapper = document.createElement("div");
        wrapper.className = "atb-info-section";

        if (type === "warning") {
            wrapper.classList.add("is-warning");
        } else if (type === "error") {
            wrapper.classList.add("is-error");
        }

        const header = document.createElement("div");
        header.className = "atb-info-header";

        const picto = type === "info" ? "ℹ️" : type === "warning" ? "⚠️" : "❌";

        const titleSpan = document.createElement("span");
        //titleSpan.innerHTML = `${picto} <strong>${title}</strong>`;
        titleSpan.innerHTML = `${picto} ${title}`;

        header.appendChild(titleSpan);
        wrapper.appendChild(header);

        if (contentHtml && contentHtml.trim() !== "") {
            const arrowSpan = document.createElement("span");
            arrowSpan.className = "atb-info-arrow";
            arrowSpan.innerText = "▼";

            header.appendChild(arrowSpan);

            const content = document.createElement("div");
            content.className = "atb-info-content";
            content.style.display = "none";
            content.innerHTML = contentHtml;

            // Toggle logic
            header.onclick = () => {
                const isExpanded = content.style.display === "block";
                content.style.display = isExpanded ? "none" : "block";
                arrowSpan.style.transform = isExpanded ? "rotate(0deg)" : "rotate(180deg)";
            };

            wrapper.appendChild(content);
        }

        return wrapper;
    }

    public static createWarningSection(title: string, contentHtml: string): HTMLDivElement {
        const wrapper = document.createElement("div");
        wrapper.className = "atb-info-section";
        wrapper.classList.add("is-warning");

        const header = document.createElement("div");
        header.className = "atb-info-header";

        const titleSpan = document.createElement("span");
        //titleSpan.innerHTML = `⚠️ <strong>${title}</strong>`;
        titleSpan.innerHTML = `⚠️ ${title}`;

        header.appendChild(titleSpan);

        wrapper.appendChild(header);
        return wrapper;
    }

    public static showDialog(title: string, htmlDescription: string, buttons: GuiDialogButton[]) {
        // Main ATB Container
        const mainContainer = document.getElementById("atb-overlay-container")!;

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

        mainContainer.appendChild(backdrop);
    }

    public static createGenericCard(title: string, titleSize: "regular" | "big" | "small", titleSeparator: boolean): HTMLDivElement {
        const card = document.createElement("div");
        card.className = "atb-panel";

        // Regular size
        let titleSizeHtml = "h3";
        if (titleSize == "big") {
            titleSizeHtml = "h2";
        }
        else if (titleSize == "small") {
            titleSizeHtml = "h4";
        }

        const titleElem = document.createElement(titleSizeHtml);
        //titleElem.style.margin = "0";
        titleElem.style.color = "var(--atb-text)";
        titleElem.style.paddingBottom = "0.3em";
        titleElem.innerText = title;

        if (titleSeparator) {
            titleElem.style.borderBottom = "1px solid var(--atb-border)";
        }

        card.appendChild(titleElem);
        return card;
    }

    public static createFeatureToggleCard(field: GuiFormField, useContentArea: boolean, rightSideElem?: HTMLElement): { card: HTMLDivElement, contentArea: HTMLDivElement } {
        if (field.type !== "checkbox" && field.type !== "display-text") {
            console.warn("ATB: createFeatureToggleCard requires a checkbox or display-text GuiFormField.");
        }
        let isEnabled = !!field.default_value;
        let isExpanded = false;

        if (field.type !== "checkbox") {
            isEnabled = true;
        }

        const card = document.createElement("div");
        card.className = `atb-feature-card ${isEnabled ? "is-enabled" : ""}`;
        if (rightSideElem) card.style.padding = "0.6em"; // lower padding when using rightSideElem

        // Row: Header
        const header = document.createElement("div");
        header.className = "atb-feature-header";

        // Left side of the header: Expand Icon + Checkbox
        const headerLeft = document.createElement("div");
        headerLeft.style.display = "flex";
        headerLeft.style.alignItems = "center";
        headerLeft.style.gap = "0.9em";

        // Expand/Collapse Icon (+/-)
        const expandIcon = document.createElement("span");
        expandIcon.style.cursor = "pointer";
        expandIcon.style.fontWeight = "bold";
        expandIcon.style.fontSize = "1.2em";
        expandIcon.style.color = "var(--atb-text-muted)";
        expandIcon.style.userSelect = "none";
        expandIcon.style.display = useContentArea ? "inline-block" : "none"; // Hide if no content
        expandIcon.style.paddingLeft = "0.3em";
        expandIcon.style.paddingRight = "0.3em";
        expandIcon.innerText = isExpanded ? "-" : "+";

        // The Main Checkbox
        let checkboxInput;
        let checkboxWrapper: HTMLElement;
        if (field.type == "checkbox") {
            checkboxWrapper = this.createCheckbox(field.html_id, field.label, field.description, isEnabled, false, field.disable ?? false);
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
        if (!rightSideElem && field.type == "checkbox") {
            statusText = document.createElement("span");
            statusText.className = "atb-feature-status";
            statusText.innerText = isEnabled ? "Enabled" : "Disabled";
            rightSideElem = statusText;
        }
        if (!rightSideElem) rightSideElem = document.createElement("div");

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