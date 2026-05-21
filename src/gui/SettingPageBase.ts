import SettingPageManager from "@/utility/SettingPageManager";
import StorageManager from "@/utility/StorageManager";

export interface GenericSettingElement {
	title: string;
	description?: string;
	type: 'checkbox' | 'number' | 'text' | 'dropdown' | 'button' | 'button_with_label'; // 'custom' to have click managed for custom draw ?
	value: any;
	onChange: (val: any) => void;
	//options?: any[]; // for dropdown
	disabled?: boolean;
	height_override?: number;
	width_override?: number;
	max_length?: number;
	// input_width_override?: number;
}

export default abstract class SettingPageBase {
	pageTitle: string = "ATB Settings";

	startLeft: number = 150;
	startTop: number = 210;
	defaultWidth: number = 600;
	defaultHeight: number = 64;
	defaultInputWidth: number = 200; // the size of the input or button for text/number/button_with_label types
	GRID_MARGIN: number = 16;
	readonly MAX_LEFT: number = 1800; // don't change it
	readonly MAX_TOP: number = 980; // don't change it

	// Need to be set in the subclass constructor
	genericElemList: Array<GenericSettingElement> = new Array<GenericSettingElement>();


	constructor(title: string) {
		this.pageTitle = title;
	}


	Load(): void {
		console.warn('ATB: SettingPageBase Load()');
		console.warn('ATB: SettingPageBase max elems per col: ' + this.getMaxElemPerColumn());
		MainCanvas.textAlign = "center";
		this.handleGenericListOperation(this.genericElemList, "Load");
	}
	Run(): void {
		MainCanvas.textAlign = "left";
		DrawTextFit(this.pageTitle, 750, 112, 600, "Black", "Gray");
		DrawButton(1815, 75, 90, 90, "", "White", "Icons/Exit.png", "Exit");

		// TODO: When multi page
		// this.ElementHide(elem.id);

		MainCanvas.textAlign = "left";
		this.handleGenericListOperation(this.genericElemList, "Run");
	}
	Click(): void {
		console.warn('ATB: SettingPageBase Click()');
		if (MouseIn(1815, 75, 90, 90)) return this.Exit();

		this.handleGenericListOperation(this.genericElemList, "Click");
	}
	Exit(): void {
		console.warn('ATB: SettingPageBase Exit()');
		this.handleGenericListOperation(this.genericElemList, "Exit");

		StorageManager.saveSettings();

		SettingPageManager.goBack();
	}
	Unload(): void {}

	DrawCheckboxRight(Left: number, Top: number, Width: number, Height: number, Text: string, IsChecked: boolean, Disabled?: boolean | undefined, TextColor?: string | undefined, CheckImage?: string | undefined): void {
		let checkboxSize = 64;
		let checkbox_top = Top - Math.floor(Height / 2);
		let text_width = Width - checkboxSize;
		DrawTextFit(Text, Left, Top, text_width, TextColor || "Black", "Gray");
		DrawCheckbox(Left + text_width, checkbox_top, 64, 64, '', IsChecked, Disabled, TextColor, CheckImage);
	}

	getLeftForElemIndex(index: number, excess_height: number = 0): number {
		let nbCol = Math.floor(index / this.getMaxElemPerColumn(excess_height));
		return this.startLeft + ((this.defaultWidth + this.GRID_MARGIN) * nbCol);
	}
	getTopForElemIndex(index: number, excess_height: number = 0): number {
		let nbRow = Math.floor(index % this.getMaxElemPerColumn(excess_height));
		return this.startTop + excess_height + ((this.defaultHeight + this.GRID_MARGIN) * nbRow);
	}
	getMaxElemPerColumn(excess_height: number = 0): number {
		let nbPerCol = Math.floor((this.MAX_TOP - this.startTop - excess_height) / (this.defaultHeight + this.GRID_MARGIN));
		if (nbPerCol < 1) nbPerCol = 1;
		return nbPerCol;
	}

	// Wrapper for generic list operations (mostly so that top/left/width/height calculations stays consistent across Run and Click)
	handleGenericListOperation(elemList: GenericSettingElement[], operation: "Load" | "Run" | "Click" | "Exit"): void {
		let override_excess_height = 0;

		for (let i = 0; i < elemList.length; i++) {
			const elem = elemList[i];
			const elem_id = "atb_settings_elem_" + i.toString();

			// TODO: if elem have width/height override, add it to the next top/left calculation ?
			let top = this.getTopForElemIndex(i, override_excess_height);
			let left = this.getLeftForElemIndex(i, override_excess_height);
			let width = elem.width_override ? elem.width_override : this.defaultWidth;
			let height = this.defaultHeight;
			if (elem.height_override) {
				height = elem.height_override;
				override_excess_height += (elem.height_override - this.defaultHeight);
			}

			// for button centring
			let button_top = top - Math.floor(height / 2);

			// for text/number/button_with_label types, reserve space for input/button
			let label_width = this.defaultWidth - this.defaultInputWidth;

			// Start of Load()
			if (operation === "Load") {
				console.warn('ATB: SettingPageBase Load() elem[' + i + "] top=" + top + " left=" + left + " width=" + width + " height=" + height + " label_width=" + label_width);
				switch (elem.type) {
					case 'number':
						ElementCreateInput(elem_id, "number", elem.value, elem.max_length || 5);
						break;
					case 'text':
						ElementCreateInput(elem_id, "text", elem.value, elem.max_length || 64);
						break;
					//case 'dropdown':
					//	elem.value = DrawDropdown(this.currentLeft, this.currentTop, width, height, elem.title, elem.value, elem['options'] || []);
					//	break;
				}
			} // End of Load()

			// Start of Run()
			else if (operation === "Run") {
				switch (elem.type) {
					case 'checkbox':
						//DrawCheckbox(left, top, 64, 64, elem.title, elem.value, elem.disabled || false);
						this.DrawCheckboxRight(left, top, width, height, elem.title, elem.value, elem.disabled || false);
						break;
					case 'number':
					case 'text':
						// TODO: handle onChange here if value changed ? (else only handled on Exit)
						//elem.onChange(ElementValue(elem_id));

						// maybe update elem.value (is it dangerous though ?)
						MainCanvas.textAlign = "left";
						DrawTextFit(elem.title, left, top, label_width, "Black", "Gray");
						MainCanvas.textAlign = "center";
						let elem_pos_fix = Math.floor(this.defaultInputWidth / 2); // cause input X pos is center based
						ElementPosition(elem_id, left + label_width + elem_pos_fix, top, this.defaultInputWidth, height);

						if (elem.disabled){
							ElementSetAttribute(elem_id, "disabled", "true");
						}
						else {
							document.getElementById(elem_id)?.removeAttribute("disabled");
						}

						MainCanvas.textAlign = "left";
						break;
					case 'button':
						MainCanvas.textAlign = "center";
						DrawButton(left, button_top, width, height, elem.title, "White", undefined, elem.description, elem.disabled || false);
						MainCanvas.textAlign = "left";
						break;
					case 'button_with_label':
						MainCanvas.textAlign = "left";
						DrawTextFit(elem.title, left, top, label_width, "Black", "Gray");
						MainCanvas.textAlign = "center";
						DrawButton(left + label_width , button_top, this.defaultInputWidth, height, elem.title, "White", undefined, elem.description, elem.disabled || false);
						MainCanvas.textAlign = "left";
						break;
					//case 'dropdown':
					//	elem.value = DrawDropdown(this.currentLeft, this.currentTop, width, height, elem.title, elem.value, elem['options'] || []);
					//	break;
				}
			} // End of Run()

			// Start of Click()
			else if (operation === "Click") {
				switch (elem.type) {
					case 'button':
						if (MouseIn(left, button_top, width, height)) {
							elem.onChange(null);
						}
						break;
					case 'button_with_label':
						if (MouseIn(left + label_width , button_top, this.defaultInputWidth, height)) {
							elem.onChange(null);
						}
						break;
					case 'checkbox':
						// TODO: add correct position for checkbox only ?
						// checkbox also use the same top calculation as button
						if (MouseIn(left, button_top, width, height)) {
							elem.value = !elem.value;
							elem.onChange(elem.value);
						}
						break;
				}
			} // End of Click()

			// Start of Exit()
			else if (operation === "Exit") {
				switch (elem.type) {
					case 'number':
						elem.onChange(Number(ElementValue(elem_id)));
						ElementRemove(elem_id);
						break;
					case 'text':
						elem.onChange(ElementValue(elem_id));
						ElementRemove(elem_id);
						break;
				}
			} // End of Exit()
		}
	}

}