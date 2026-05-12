export const uiStyles = `
    :root {
        --atb-bg-base: #1a1a1a;
        --atb-bg-panel: #2a2a2a;
        --atb-bg-card: #333333;
        --atb-bg-input: #222222;
        --atb-border: #444444;
        --atb-text: white;
        --atb-text-secondary: #cccccc;
        --atb-text-muted: #aaaaaa;
        --atb-primary: #2196F3;
        --atb-primary-hover: #1e88e5;
        --atb-success: #4CAF50;
        --atb-danger: #F44336;
    }

    /* Layout Components */
    .atb-overlay-container {
        display: flex; flex-direction: column;
        width: 55rem;
        height: 40rem;
        background: var(--atb-bg-base); color: var(--atb-text);
        border: 2px solid var(--atb-border); border-radius: 8px;
        z-index: 2000; position: absolute;
        top: 50%; left: 50%; transform: translate(-50%, -50%);
        font-family: sans-serif; overflow: hidden;
    }

    .atb-title-bar {
        display: flex; justify-content: space-between; align-items: center;
        padding: 15px 20px; background: var(--atb-bg-input);
        border-bottom: 1px solid var(--atb-bg-card);
    }

    .atb-body-wrapper { display: flex; flex: 1; overflow: hidden; }

    .atb-sidebar {
        width: 180px; background: #252525; border-right: 1px solid var(--atb-bg-card);
        display: flex; flex-direction: column; padding: 15px 0; flex-shrink: 0;
    }

    .atb-content-area {
        flex: 1;
        display: flex;
        flex-direction: column;
        padding: 20px;
        gap: 15px;
        overflow-y: auto;
    }

    /* Panels & Cards */
    .atb-panel { background: var(--atb-bg-panel); padding: 15px; border-radius: 6px; }
    .atb-task-card {
        background: var(--atb-bg-card);
        padding: 15px;
        //margin-bottom: 15px;
        border-radius: 6px; display: flex; justify-content: space-between; align-items: center;
    }

    /* Buttons */
    .atb-close-btn {
        background: none; border: none; color: var(--atb-text-muted);
        font-size: 1.2em; cursor: pointer;
    }

    .atb-nav-btn {
        background: transparent; color: var(--atb-text-muted); border: none;
        padding: 15px 20px; text-align: left; cursor: pointer;
        border-left: 4px solid transparent; outline: none;
        font-size: 1em; transition: background 0.2s, color 0.2s;
    }
    .atb-nav-btn:hover { background: var(--atb-bg-card); }
    .atb-nav-btn.active {
        background: var(--atb-bg-card); color: var(--atb-text);
        border-left-color: var(--atb-primary);
    }

    .atb-action-btn {
        padding: 8px;
        background: #555; color: var(--atb-text);
        border: none; border-radius: 4px;
        cursor: pointer;
        transition: background 0.2s;
        font-size: 0.9em;
    }
    .atb-action-btn:hover { background: #666; }

    .atb-main-btn {
        padding: 12px; background: var(--atb-primary); color: var(--atb-text);
        border: none; border-radius: 6px; cursor: pointer;
        font-weight: bold; transition: background 0.2s;
    }
    .atb-main-btn:hover { background: var(--atb-primary-hover); }
    .atb-main-btn.success { background: var(--atb-success); }
    .atb-main-btn.failed { background: var(--atb-danger); }

    /* Forms */
    .atb-form-group { display: flex; flex-direction: column; gap: 5px; }
    .atb-form-label { font-size: 0.9em; color: var(--atb-text-secondary); }
    .atb-form-input {
        padding: 5px 7px;
        background: var(--atb-bg-input); color: var(--atb-text);
        border: 1px solid var(--atb-border); border-radius: 4px;
    }
    .atb-dynamic-fields {
        display: flex; flex-direction: column; gap: 15px; padding: 15px;
        background: var(--atb-bg-card); border-radius: 6px; border: 1px dashed #555;
    }

    /* Progress Bars */
    .atb-progress-bg {
        //flex: 1;
        height: 6px;
        background: #555;
        border-radius: 3px;
        overflow: hidden;
    }
    .atb-progress-fill { height: 100%; background: var(--atb-primary); }
    .atb-progress-fill.danger { background: var(--atb-danger); }

    .atb-content-title {
        //margin: 0 0 20px 0;
        border-bottom: 1px solid #444;
        padding-bottom: 10px;
        padding-top: 10px;
    }

    /* Custom Checkbox */
    .atb-checkbox-label {
        display: flex;
        align-items: center;
        gap: 10px;
        cursor: pointer;
        color: var(--atb-text-secondary);
        font-size: 0.9em;
    }

    .atb-form-checkbox {
        /* Override native style */
        appearance: none;
        -webkit-appearance: none;

        width: 20px;
        height: 20px;
        margin: 0;
        background: var(--atb-bg-input);
        border: 1px solid var(--atb-border);
        border-radius: 4px;
        cursor: pointer;
        position: relative;
        transition: background 0.2s, border-color 0.2s;
    }

    .atb-form-checkbox:checked {
        background: var(--atb-primary);
        border-color: var(--atb-primary);
    }

    .atb-form-checkbox:checked::after {
        content: '';
        position: absolute;
        left: 6px;
        top: 2px;
        width: 5px;
        height: 10px;
        border: solid white;
        border-width: 0 2px 2px 0;
        transform: rotate(45deg);
    }


    /* Help Section (Collapsible) */
    .atb-help-section {
        background: var(--atb-bg-input);
        border: 1px solid var(--atb-border);
        border-radius: 6px;
        overflow: hidden;
    }

    .atb-help-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 6px 8px;
        font-size: 0.9em;
        color: var(--atb-text-secondary);
        cursor: pointer;
        user-select: none;
        transition: background 0.2s;
    }

    .atb-help-header:hover {
        background: var(--atb-bg-card);
    }

    .atb-help-arrow {
        transition: transform 0.3s ease;
        font-size: 0.8em;
        color: var(--atb-text-muted);
    }

    .atb-help-content {
        padding: 15px;
        border-top: 1px solid var(--atb-border);
        font-size: 0.85em;
        color: var(--atb-text-muted);
        line-height: 1.4;
        background: var(--atb-bg-base);
    }


    /* Dialogs / Alerts */
    .atb-dialog-backdrop {
        position: absolute; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.75); backdrop-filter: blur(2px);
        display: flex; justify-content: center; align-items: center;
        z-index: 3000;
    }

    .atb-dialog-box {
        background: var(--atb-bg-panel); border: 1px solid var(--atb-border);
        border-radius: 8px; padding: 20px; width: 400px; max-width: 90%;
        display: flex; flex-direction: column; gap: 15px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.5);
    }

    .atb-dialog-title {
        margin: 0; font-size: 1.2em; color: var(--atb-text);
        border-bottom: 1px solid var(--atb-bg-card); padding-bottom: 10px;
    }

    .atb-dialog-text {
        font-size: 0.9em; color: var(--atb-text-muted);
        line-height: 1.5; margin: 0;
    }

    .atb-dialog-buttons {
        display: flex; justify-content: flex-end; gap: 10px; margin-top: 5px;
    }


    /* Feature Toggle Cards */
    .atb-feature-card {
        background: var(--atb-bg-panel);
        border-radius: 6px;
        padding: 15px;
        display: flex;
        flex-direction: column;
        gap: 15px;
        border-left: 4px solid #555; /* Default disabled border */
        transition: border-color 0.3s;
    }

    .atb-feature-card.is-enabled {
        border-left-color: var(--atb-primary);
    }

    .atb-feature-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .atb-feature-status {
        font-size: 0.85em;
        font-weight: bold;
        text-transform: uppercase;
        color: var(--atb-text-muted);
        transition: color 0.3s;
    }

    .atb-feature-card.is-enabled .atb-feature-status {
        color: var(--atb-primary);
    }

    .atb-feature-content {
        display: flex;
        flex-direction: column;
        gap: 15px;
        padding-top: 15px;
        border-top: 1px solid var(--atb-bg-card);
    }
`;