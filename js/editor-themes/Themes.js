import getHexFor from "../utils/ColorConverter";
import ColorPicker from "../menubar/ColorPicker";

export function enableLightThemeForEditor(colorOptions, rteView) {
    let { editorLightThemeColors, menubarLightThemeColors } = rteView.options
    colorOptions = preProcessEditorFontAndBGColors(colorOptions)

    if(colorOptions) {
        // editor related css variables
        editorLightThemeColors['--rte-text-color'] = colorOptions['--rte-text-color'] || editorLightThemeColors['--rte-text-color']
        editorLightThemeColors['--rte-bg-color'] = colorOptions['--rte-bg-color'] || editorLightThemeColors['--rte-bg-color']

        editorLightThemeColors['--rte-placeholder-color'] = colorOptions['--rte-placeholder-color'] || editorLightThemeColors['--rte-placeholder-color']
        editorLightThemeColors['--rte-node-border-selected-color'] = colorOptions['--rte-node-border-selected-color'] || editorLightThemeColors['--rte-node-border-selected-color']
        editorLightThemeColors['--rte-link-text-color'] = colorOptions['--rte-link-text-color'] || editorLightThemeColors['--rte-link-text-color']
        
        editorLightThemeColors['--rte-table-border-color'] = colorOptions['--rte-table-border-color'] || editorLightThemeColors['--rte-table-border-color']
        editorLightThemeColors['--rte-table-cell-bg-selected-color'] = colorOptions['--rte-table-cell-bg-selected-color'] || editorLightThemeColors['--rte-table-cell-bg-selected-color']
        editorLightThemeColors['--rte-table-cursor-resize-bg-color'] = colorOptions['--rte-table-cursor-resize-bg-color'] || editorLightThemeColors['--rte-table-cursor-resize-bg-color']
        
        editorLightThemeColors['--rte-inline-quote-text-color'] = colorOptions['--rte-inline-quote-text-color'] || editorLightThemeColors['--rte-inline-quote-text-color']
        editorLightThemeColors['--rte-inline-quote-bg-color'] = colorOptions['--rte-inline-quote-bg-color'] || editorLightThemeColors['--rte-inline-quote-bg-color']
        
        editorLightThemeColors['--rte-blockquote-bg-color'] = colorOptions['--rte-blockquote-bg-color'] || editorLightThemeColors['--rte-blockquote-bg-color']
        editorLightThemeColors['--rte-blockquote-border-color'] = colorOptions['--rte-blockquote-border-color'] || editorLightThemeColors['--rte-blockquote-border-color']
        
        editorLightThemeColors['--rte-mentions-bg-color'] = colorOptions['--rte-mentions-bg-color'] || editorLightThemeColors['--rte-mentions-bg-color']
        editorLightThemeColors['--rte-mentions-border-color'] = colorOptions['--rte-mentions-border-color'] || editorLightThemeColors['--rte-mentions-border-color']
        editorLightThemeColors['--rte-mentions-text-color'] = colorOptions['--rte-mentions-text-color'] || editorLightThemeColors['--rte-mentions-text-color']
        
        editorLightThemeColors['--rte-mentions-list-bg-color'] = colorOptions['--rte-mentions-list-bg-color'] || editorLightThemeColors['--rte-mentions-list-bg-color']
        editorLightThemeColors['--rte-mentions-list-border-color'] = colorOptions['--rte-mentions-list-border-color'] || editorLightThemeColors['--rte-mentions-list-border-color']
        editorLightThemeColors['--rte-mentions-list-text-color'] = colorOptions['--rte-mentions-list-text-color'] || editorLightThemeColors['--rte-mentions-list-text-color']
        editorLightThemeColors['--rte-mentions-list-box-shadow-color'] = colorOptions['--rte-mentions-list-box-shadow-color'] || editorLightThemeColors['--rte-mentions-list-box-shadow-color']
        editorLightThemeColors['--rte-mentions-list-gray-text-color'] = colorOptions['--rte-mentions-list-gray-text-color'] || editorLightThemeColors['--rte-mentions-list-gray-text-color']
        editorLightThemeColors['--rte-mentions-list-bg-selected-color'] = colorOptions['--rte-mentions-list-bg-selected-color'] || editorLightThemeColors['--rte-mentions-list-bg-selected-color']

        editorLightThemeColors['--rte-image-resize-bg-color'] = colorOptions['--rte-image-resize-bg-color'] || editorLightThemeColors['--rte-image-resize-bg-color']

        // menubar related css variables
        menubarLightThemeColors['--rte-icon-fill-color'] = colorOptions['--rte-icon-fill-color'] || menubarLightThemeColors['--rte-icon-fill-color']
        menubarLightThemeColors['--rte-icon-fill-color-contrast'] = colorOptions['--rte-icon-fill-color-contrast'] || menubarLightThemeColors['--rte-icon-fill-color-contrast']

        menubarLightThemeColors['--rte-toolbar-text-color'] = colorOptions['--rte-toolbar-text-color'] || menubarLightThemeColors['--rte-toolbar-text-color']
        menubarLightThemeColors['--rte-toolbar-bg-color'] = colorOptions['--rte-toolbar-bg-color'] || menubarLightThemeColors['--rte-toolbar-bg-color']
        menubarLightThemeColors['--rte-toolbar-border-color'] = colorOptions['--rte-toolbar-border-color'] || menubarLightThemeColors['--rte-toolbar-border-color']
        menubarLightThemeColors['--rte-toolbar-bg-selected-color'] = colorOptions['--rte-toolbar-bg-selected-color'] || menubarLightThemeColors['--rte-toolbar-bg-selected-color']
        menubarLightThemeColors['--rte-toolbar-border-selected-color'] = colorOptions['--rte-toolbar-border-selected-color'] || menubarLightThemeColors['--rte-toolbar-border-selected-color']
        menubarLightThemeColors['--rte-toolbar-group-separator-bg-color'] = colorOptions['--rte-toolbar-group-separator-bg-color'] || menubarLightThemeColors['--rte-toolbar-group-separator-bg-color']

        menubarLightThemeColors['--rte-zdropdown-text-color'] = colorOptions['--rte-zdropdown-text-color'] || menubarLightThemeColors['--rte-zdropdown-text-color']
        menubarLightThemeColors['--rte-zdropdown-bg-color'] = colorOptions['--rte-zdropdown-bg-color'] || menubarLightThemeColors['--rte-zdropdown-bg-color']
        menubarLightThemeColors['--rte-zdropdown-border-color'] = colorOptions['--rte-zdropdown-border-color'] || menubarLightThemeColors['--rte-zdropdown-border-color']
        menubarLightThemeColors['--rte-zdropdown-text-selected-color'] = colorOptions['--rte-zdropdown-text-selected-color'] || menubarLightThemeColors['--rte-zdropdown-text-selected-color']
        menubarLightThemeColors['--rte-zdropdown-bg-selected-color'] = colorOptions['--rte-zdropdown-bg-selected-color'] || menubarLightThemeColors['--rte-zdropdown-bg-selected-color']
        menubarLightThemeColors['--rte-zdropdown-border-selected-color'] = colorOptions['--rte-zdropdown-border-selected-color'] || menubarLightThemeColors['--rte-zdropdown-border-selected-color']
        
        menubarLightThemeColors['--rte-btn-primary-text-color'] = colorOptions['--rte-btn-primary-text-color'] || menubarLightThemeColors['--rte-btn-primary-text-color']
        menubarLightThemeColors['--rte-btn-primary-bg-color'] = colorOptions['--rte-btn-primary-bg-color'] || menubarLightThemeColors['--rte-btn-primary-bg-color']
        menubarLightThemeColors['--rte-btn-primary-border-color'] = colorOptions['--rte-btn-primary-border-color'] || menubarLightThemeColors['--rte-btn-primary-border-color']
        
        menubarLightThemeColors['--rte-btn-secondary-text-color'] = colorOptions['--rte-btn-secondary-text-color'] || menubarLightThemeColors['--rte-btn-secondary-text-color']
        menubarLightThemeColors['--rte-btn-secondary-bg-color'] = colorOptions['--rte-btn-secondary-bg-color'] || menubarLightThemeColors['--rte-btn-secondary-bg-color']
        menubarLightThemeColors['--rte-btn-secondary-border-color'] = colorOptions['--rte-btn-secondary-border-color'] || menubarLightThemeColors['--rte-btn-secondary-border-color']
    }

    // the basic structure of rte is
    // <rteDiv>
    //      <menubarDiv>
    //              ...menubar related dom
    //      </menubarDiv>
    //      <editorDiv>
    //              ...editor related dom
    //      </editorDiv>
    // </rteDiv>
    
    // As of now css variable values in editorLightThemeColors is added to rteDiv
    // can't set css variable values in editorLightThemeColors to editorDiv and css variable values in menubarLightThemeColors to menubarDiv
    // because mentions dropdown, emoji dropdown, suggestions dropdown related css variable values is present in editorLightThemeColors
    // and if suppose editorLightThemeColors are set to editorDiv alone then the css variables for
    // these dropdowns (dropdowns are appended to rteDiv), will not be applied
    // basically these dropdown related css variables will not have any values as a result it will break
    // but if we set these css variables to rteDiv then the css variables for these dropdown will have values, as a result it will work properly.
    // this is not the only disadvantage of setting editor related css variables to editorDiv and menubar related css variables to menubarDiv
    // there might be other problems also, haven't analysed this route fully

    // the drawback of this method is, if some team wants to move the editorDiv alone or menubarDiv alone outside the rteDiv to a place somewhere else,
    // then css variable values will not be applied
    // for this case the integrating teams should iterate the this.editorLightThemeColors, this.menubarLightThemeColors array(if editor is in light theme)
    // and set the css variable values to the editor or menubar div based on which they are removing out of rteDiv, similarly they need to do for dark theme also
    
    // This is the reason why we have pointed the editor color related css variables and their values to rteView instance
    // as a result product teams can access css variables like rteView.options.editorLightThemeColors, rteView.options.editorDarkThemeColors, etc.

    for(var cssVar in editorLightThemeColors) {
        rteView.dom.style.setProperty(cssVar, editorLightThemeColors[cssVar])

        updateEditorFontRelatedSettings(editorLightThemeColors, rteView)
    }
    if(rteView.menubar) {
        for(cssVar in menubarLightThemeColors) {
            rteView.dom.style.setProperty(cssVar, menubarLightThemeColors[cssVar])
        }

        rteView.menubar.menus.forEach(menu => {
            if(menu instanceof ColorPicker) {
                menu.changeDefaultValue("light")
            }
        })
    }

    rteView.editorView.dom.dispatchEvent(new CustomEvent("cmLightMode"))
}

export function enableDarkThemeForEditor(colorOptions, rteView) {
    let { editorDarkThemeColors, menubarDarkThemeColors } = rteView.options
    colorOptions = preProcessEditorFontAndBGColors(colorOptions)

    if(colorOptions) {
        // editor related css variables
        editorDarkThemeColors['--rte-text-color'] = colorOptions['--rte-text-color'] || editorDarkThemeColors['--rte-text-color']
        editorDarkThemeColors['--rte-bg-color'] = colorOptions['--rte-bg-color'] || editorDarkThemeColors['--rte-bg-color']

        editorDarkThemeColors['--rte-placeholder-color'] = colorOptions['--rte-placeholder-color'] || editorDarkThemeColors['--rte-placeholder-color']
        editorDarkThemeColors['--rte-node-border-selected-color'] = colorOptions['--rte-node-border-selected-color'] || editorDarkThemeColors['--rte-node-border-selected-color']
        editorDarkThemeColors['--rte-link-text-color'] = colorOptions['--rte-link-text-color'] || editorDarkThemeColors['--rte-link-text-color']
        
        editorDarkThemeColors['--rte-table-border-color'] = colorOptions['--rte-table-border-color'] || editorDarkThemeColors['--rte-table-border-color']
        editorDarkThemeColors['--rte-table-cell-bg-selected-color'] = colorOptions['--rte-table-cell-bg-selected-color'] || editorDarkThemeColors['--rte-table-cell-bg-selected-color']
        editorDarkThemeColors['--rte-table-cursor-resize-bg-color'] = colorOptions['--rte-table-cursor-resize-bg-color'] || editorDarkThemeColors['--rte-table-cursor-resize-bg-color']
        
        editorDarkThemeColors['--rte-inline-quote-text-color'] = colorOptions['--rte-inline-quote-text-color'] || editorDarkThemeColors['--rte-inline-quote-text-color']
        editorDarkThemeColors['--rte-inline-quote-bg-color'] = colorOptions['--rte-inline-quote-bg-color'] || editorDarkThemeColors['--rte-inline-quote-bg-color']
        
        editorDarkThemeColors['--rte-blockquote-bg-color'] = colorOptions['--rte-blockquote-bg-color'] || editorDarkThemeColors['--rte-blockquote-bg-color']
        editorDarkThemeColors['--rte-blockquote-border-color'] = colorOptions['--rte-blockquote-border-color'] || editorDarkThemeColors['--rte-blockquote-border-color']
        
        editorDarkThemeColors['--rte-mentions-bg-color'] = colorOptions['--rte-mentions-bg-color'] || editorDarkThemeColors['--rte-mentions-bg-color']
        editorDarkThemeColors['--rte-mentions-border-color'] = colorOptions['--rte-mentions-border-color'] || editorDarkThemeColors['--rte-mentions-border-color']
        editorDarkThemeColors['--rte-mentions-text-color'] = colorOptions['--rte-mentions-text-color'] || editorDarkThemeColors['--rte-mentions-text-color']
        
        editorDarkThemeColors['--rte-mentions-list-bg-color'] = colorOptions['--rte-mentions-list-bg-color'] || editorDarkThemeColors['--rte-mentions-list-bg-color']
        editorDarkThemeColors['--rte-mentions-list-border-color'] = colorOptions['--rte-mentions-list-border-color'] || editorDarkThemeColors['--rte-mentions-list-border-color']
        editorDarkThemeColors['--rte-mentions-list-text-color'] = colorOptions['--rte-mentions-list-text-color'] || editorDarkThemeColors['--rte-mentions-list-text-color']
        editorDarkThemeColors['--rte-mentions-list-box-shadow-color'] = colorOptions['--rte-mentions-list-box-shadow-color'] || editorDarkThemeColors['--rte-mentions-list-box-shadow-color']
        editorDarkThemeColors['--rte-mentions-list-gray-text-color'] = colorOptions['--rte-mentions-list-gray-text-color'] || editorDarkThemeColors['--rte-mentions-list-gray-text-color']
        editorDarkThemeColors['--rte-mentions-list-bg-selected-color'] = colorOptions['--rte-mentions-list-bg-selected-color'] || editorDarkThemeColors['--rte-mentions-list-bg-selected-color']

        editorDarkThemeColors['--rte-image-resize-bg-color'] = colorOptions['--rte-image-resize-bg-color'] || editorDarkThemeColors['--rte-image-resize-bg-color']

        // menubar related css variables
        menubarDarkThemeColors['--rte-icon-fill-color'] = colorOptions['--rte-icon-fill-color'] || menubarDarkThemeColors['--rte-icon-fill-color']
        menubarDarkThemeColors['--rte-icon-fill-color-contrast'] = colorOptions['--rte-icon-fill-color-contrast'] || menubarDarkThemeColors['--rte-icon-fill-color-contrast']

        menubarDarkThemeColors['--rte-toolbar-text-color'] = colorOptions['--rte-toolbar-text-color'] || menubarDarkThemeColors['--rte-toolbar-text-color']
        menubarDarkThemeColors['--rte-toolbar-bg-color'] = colorOptions['--rte-toolbar-bg-color'] || menubarDarkThemeColors['--rte-toolbar-bg-color']
        menubarDarkThemeColors['--rte-toolbar-border-color'] = colorOptions['--rte-toolbar-border-color'] || menubarDarkThemeColors['--rte-toolbar-border-color']
        menubarDarkThemeColors['--rte-toolbar-bg-selected-color'] = colorOptions['--rte-toolbar-bg-selected-color'] || menubarDarkThemeColors['--rte-toolbar-bg-selected-color']
        menubarDarkThemeColors['--rte-toolbar-border-selected-color'] = colorOptions['--rte-toolbar-border-selected-color'] || menubarDarkThemeColors['--rte-toolbar-border-selected-color']
        menubarDarkThemeColors['--rte-toolbar-group-separator-bg-color'] = colorOptions['--rte-toolbar-group-separator-bg-color'] || menubarDarkThemeColors['--rte-toolbar-group-separator-bg-color']

        menubarDarkThemeColors['--rte-zdropdown-text-color'] = colorOptions['--rte-zdropdown-text-color'] || menubarDarkThemeColors['--rte-zdropdown-text-color']
        menubarDarkThemeColors['--rte-zdropdown-bg-color'] = colorOptions['--rte-zdropdown-bg-color'] || menubarDarkThemeColors['--rte-zdropdown-bg-color']
        menubarDarkThemeColors['--rte-zdropdown-border-color'] = colorOptions['--rte-zdropdown-border-color'] || menubarDarkThemeColors['--rte-zdropdown-border-color']
        menubarDarkThemeColors['--rte-zdropdown-text-selected-color'] = colorOptions['--rte-zdropdown-text-selected-color'] || menubarDarkThemeColors['--rte-zdropdown-text-selected-color']
        menubarDarkThemeColors['--rte-zdropdown-bg-selected-color'] = colorOptions['--rte-zdropdown-bg-selected-color'] || menubarDarkThemeColors['--rte-zdropdown-bg-selected-color']
        menubarDarkThemeColors['--rte-zdropdown-border-selected-color'] = colorOptions['--rte-zdropdown-border-selected-color'] || menubarDarkThemeColors['--rte-zdropdown-border-selected-color']
        
        menubarDarkThemeColors['--rte-btn-primary-text-color'] = colorOptions['--rte-btn-primary-text-color'] || menubarDarkThemeColors['--rte-btn-primary-text-color']
        menubarDarkThemeColors['--rte-btn-primary-bg-color'] = colorOptions['--rte-btn-primary-bg-color'] || menubarDarkThemeColors['--rte-btn-primary-bg-color']
        menubarDarkThemeColors['--rte-btn-primary-border-color'] = colorOptions['--rte-btn-primary-border-color'] || menubarDarkThemeColors['--rte-btn-primary-border-color']
        
        menubarDarkThemeColors['--rte-btn-secondary-text-color'] = colorOptions['--rte-btn-secondary-text-color'] || menubarDarkThemeColors['--rte-btn-secondary-text-color']
        menubarDarkThemeColors['--rte-btn-secondary-bg-color'] = colorOptions['--rte-btn-secondary-bg-color'] || menubarDarkThemeColors['--rte-btn-secondary-bg-color']
        menubarDarkThemeColors['--rte-btn-secondary-border-color'] = colorOptions['--rte-btn-secondary-border-color'] || menubarDarkThemeColors['--rte-btn-secondary-border-color']    
    }

    for(var cssVar in editorDarkThemeColors) {
        rteView.dom.style.setProperty(cssVar, editorDarkThemeColors[cssVar])

        updateEditorFontRelatedSettings(editorDarkThemeColors, rteView)
    }

    if(rteView.menubar) {
        for(cssVar in menubarDarkThemeColors) {
            rteView.dom.style.setProperty(cssVar, menubarDarkThemeColors[cssVar])
        }

        rteView.menubar.menus.forEach(menu => {
            if(menu instanceof ColorPicker) {
                menu.changeDefaultValue("dark")
            }
        })
    }

    rteView.editorView.dom.dispatchEvent(new CustomEvent("cmDarkMode"))
}

function preProcessEditorFontAndBGColors(colorOptions) {
    // only allow #rrggbbaa format for font color and background color because, font nodes and other related code are designed assuming only rteView format will
    // come inside the editor
    if(colorOptions) {
        if(colorOptions['--rte-text-color']) {
            colorOptions['--rte-text-color'] = getHexFor(colorOptions['--rte-text-color'])
        }

        if(colorOptions['--rte-bg-color']) {
            colorOptions['--rte-bg-color'] = getHexFor(colorOptions['--rte-bg-color'])
        }
    }

    return colorOptions
}

function updateEditorFontRelatedSettings(editorColors, rteView) {
    rteView.options.defaultFontColor = editorColors['--rte-text-color']
    rteView.options.defaultBackgroundColor = editorColors['--rte-bg-color']
}