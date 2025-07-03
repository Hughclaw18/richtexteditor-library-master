export function getEditorLightThemeColors() {
    return {
        "--rte-text-color": "#000000ff", // keep this in #rrggbbaa format only becuase parseDOM, rteView.options.defaultFontColor, setFontColor function
        // and few other places are written assuming that this is a #rrggbbaa format
        "--rte-bg-color": "#ffffffff", // keep this in #rrggbbaa format only becuase parseDOM, rteView.options.defaultBackgroundColor, setBackgroundColor function
        //  and few other places are written assuming that this is a #rrggbbaa format
        
        "--rte-placeholder-color": "#999",
        "--rte-node-border-selected-color": "rgb(37, 88, 187)",
        "--rte-link-text-color": "rgb(37, 88, 187)",

        "--rte-table-border-color": "#999",
        "--rte-table-cell-bg-selected-color": "rgb(33 150 243 / 12%)",
        "--rte-table-cursor-resize-bg-color": "rgb(37, 88, 187)",
        
        "--rte-inline-quote-text-color": "#000000ff",
        "--rte-inline-quote-bg-color": "#f0f0f0",
        
        "--rte-blockquote-bg-color": "#f5f5f5",
        "--rte-blockquote-border-color": "#a6a6a6",
        
        "--rte-mentions-bg-color": "rgb(241, 242, 243)",
        "--rte-mentions-border-color": "rgb(218, 219, 221)",
        "--rte-mentions-text-color" : "rgb(37, 88, 187)",
        
        "--rte-mentions-list-bg-color" : "rgb(255, 255, 255)",
        "--rte-mentions-list-border-color" : "rgb(218, 219, 221)",
        "--rte-mentions-list-text-color" : "rgb(24, 25, 27)",
        "--rte-mentions-list-box-shadow-color" : "rgba(0, 0, 0, 0.2)",
        "--rte-mentions-list-gray-text-color" : "rgb(24, 25, 27)",
        "--rte-mentions-list-bg-selected-color" : "rgb(237, 238, 240)",

        "--rte-image-resize-bg-color": "rgb(51, 102, 255)"
    }
}

export function getEditorDarkThemeColors() {
    return {
        "--rte-text-color": "#edeef0cc", // keep this in #rrggbbaa format only becuase parseDOM, rteView.options.defaultFontColor, setFontColor function
        // and few other places are written assuming that this is a #rrggbbaa format
        "--rte-bg-color": "#242628ff", // keep this in #rrggbbaa format only becuase parseDOM, rteView.options.defaultBackgroundColor, setBackgroundColor function
        //  and few other places are written assuming that this is a #rrggbbaa format
        
        "--rte-placeholder-color": "#999",
        "--rte-node-border-selected-color": "rgb(94, 147, 255)",
        "--rte-link-text-color": "rgb(94, 147, 255)",

        "--rte-table-border-color": "#999",
        "--rte-table-cell-bg-selected-color": "rgb(55, 71, 84)",
        "--rte-table-cursor-resize-bg-color": "rgb(94, 147, 255)",
        
        "--rte-inline-quote-text-color": "#edeef0cc",
        "--rte-inline-quote-bg-color": "#625f5f",
        
        "--rte-blockquote-bg-color": "#ffffff47",
        "--rte-blockquote-border-color": "#d8d8da",
        
        "--rte-mentions-bg-color": "rgb(48, 50, 53)",
        "--rte-mentions-border-color": "rgb(140, 145, 154)",
        "--rte-mentions-text-color" : "rgb(94, 147, 255)",
        
        "--rte-mentions-list-bg-color" : "rgb(24, 25, 27)",
        "--rte-mentions-list-border-color" : "rgb(140, 145, 154)",
        "--rte-mentions-list-text-color" : "rgb(188, 190, 194)",
        "--rte-mentions-list-box-shadow-color" : "rgb(0, 0, 0, 0.88)",
        "--rte-mentions-list-gray-text-color" : "rgb(188, 190, 194)",
        "--rte-mentions-list-bg-selected-color" : "rgb(55, 57, 62)",

        "--rte-image-resize-bg-color": "rgb(51, 102, 255)"
    }
}

export function getMenubarLightThemeColors() {
    return {
        "--rte-icon-fill-color": "rgb(0, 0, 0)",
        "--rte-icon-fill-color-contrast": "rgb(255, 255, 255)",
        
        "--rte-toolbar-text-color": "rgb(0, 0, 0)",
        "--rte-toolbar-bg-color": "rgb(241, 242, 243)",
        "--rte-toolbar-border-color": "rgb(218, 219, 221)",
        "--rte-toolbar-bg-selected-color": "rgb(255, 255, 255)",
        "--rte-toolbar-border-selected-color": "rgb(218, 219, 221)",
        "--rte-toolbar-group-separator-bg-color" : "rgb(229, 229, 229)",
        
        "--rte-zdropdown-text-color": "rgb(24, 25, 27)",
        "--rte-zdropdown-bg-color": "rgb(255, 255, 255)",
        "--rte-zdropdown-border-color": "rgb(218, 219, 221)",
        "--rte-zdropdown-text-selected-color": "rgb(24, 25, 27)",
        "--rte-zdropdown-bg-selected-color" : "rgb(237, 238, 240)",
        "--rte-zdropdown-border-selected-color" : "rgb(237, 238, 240)",
        
        "--rte-btn-primary-text-color": "rgb(255, 255, 255)",
        "--rte-btn-primary-bg-color": "rgb(44, 102, 221)",
        "--rte-btn-primary-border-color": "rgb(44, 102, 221)",
        
        "--rte-btn-secondary-text-color": "rgb(37, 88, 187)",
        "--rte-btn-secondary-bg-color": "rgba(0, 0, 0, 0)",
        "--rte-btn-secondary-border-color": "rgb(37, 88, 187)"
    }
}

export function getMenubarDarkThemeColors() {
    return {
        "--rte-icon-fill-color": "rgb(242, 243, 244)",
        "--rte-icon-fill-color-contrast": "rgb(0, 0, 0)",
        
        "--rte-toolbar-text-color": "rgb(242, 243, 244)",
        "--rte-toolbar-bg-color": "rgb(48, 50, 53)",
        "--rte-toolbar-border-color": "rgb(140, 145, 154)",
        "--rte-toolbar-bg-selected-color": "rgb(36, 38, 40)",
        "--rte-toolbar-border-selected-color": "rgb(140, 145, 154)",
        "--rte-toolbar-group-separator-bg-color" : "rgb(82, 94, 103)",
        
        "--rte-zdropdown-text-color": "rgb(188, 190, 194)",
        "--rte-zdropdown-bg-color": "rgb(24, 25, 27)",
        "--rte-zdropdown-border-color": "rgb(140, 145, 154)",
        "--rte-zdropdown-text-selected-color": "rgb(188, 190, 194)",
        "--rte-zdropdown-bg-selected-color" : "rgb(55, 57, 62)",
        "--rte-zdropdown-border-selected-color" : "rgb(55, 57, 62)",
        
        "--rte-btn-primary-text-color": "rgb(255, 255, 255)",
        "--rte-btn-primary-bg-color": "rgb(44, 102, 221)",
        "--rte-btn-primary-border-color": "rgb(44, 102, 221)",
        
        "--rte-btn-secondary-text-color": "rgb(94, 147, 255)",
        "--rte-btn-secondary-bg-color": "rgba(0, 0, 0, 0)",
        "--rte-btn-secondary-border-color": "rgb(94, 147, 255)"
    }
}