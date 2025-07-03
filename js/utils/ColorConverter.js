export default function getHexFor(color) {
    var color = new ColorConverter(color)
    return color.getHEXWithAlpha()
}

class ColorConverter {
    constructor(val) {
        var color = this.convert(val);
        this.red = parseInt(color.red);
        this.green = parseInt(color.green);
        this.blue = parseInt(color.blue);
        this.alpha = parseFloat((color.alpha >=0 && color.alpha <= 1)?color.alpha:1);
    }

    convert(color) {
        var reI = '\\s*([0-9]|[1-9][0-9]|[0-1][0-9][0-9]|2[0-4][0-9]|25[0-5])\\s*' //no i18n
        var reN = '\\s*(0(\.[0-9]{1,2})?|1(\.00?)?)\\s*' //no i18n
        var reP = '\\s*(100(\.00?)?|[1-9]?\\d(\.\\d\\d?)?)%\\s*' //no i18n
        var reH = '\\s*([0-9]|[1-9][0-9]|[0-2][0-9][0-9]|3[0-5][0-9])\\s*' //no i18n
        var hex3 = '([A-Fa-f0-9])' //no i18n
        var hex6 = '([A-Fa-f0-9]{2})'; //no i18n

        var reRgbInteger = new RegExp('^rgb\\(' + [reI, reI, reI] + '\\)$')
        var reRgbPercent = new RegExp('^rgb\\(' + [reP, reP, reP] + '\\)$');
        var reRgbaInteger = new RegExp('^rgba\\(' + [reI, reI, reI, reN] + '\\)$')
        var reRgbaPercent = new RegExp('^rgba\\(' + [reP, reP, reP, reN] + '\\)$');
        var reHslPercent = new RegExp('^hsl\\(' + [reH, reP, reP] + '\\)$')
        var reHslaPercent = new RegExp('^hsla\\(' + [reH, reP, reP, reN] + '\\)$');
        var reHex3Length = new RegExp('^#'+hex3+hex3+hex3+'$')
        var reHex6Length = new RegExp('^#'+hex6+hex6+hex6+'$');
        var reHex8Length = new RegExp('^#'+hex6+hex6+hex6+hex6+'$');

        var m;
        if(!color || color.length == 0 || color === 'none' || color === 'transparent'){//Null condition check
            return this.rgbToObj(0,0,0,0);
        }else if ((m = reRgbInteger.exec(color))) { // rgb(255, 0, 0)
            return this.rgbToObj(m[1], m[2], m[3], 1);
        } else if ((m = reRgbPercent.exec(color))) { // rgb(100%, 0%, 0%)
            return this.rgbToObj(m[1] * 255 / 100, m[4] * 255 / 100, m[7] * 255 / 100, 1);
        } else if ((m = reRgbaInteger.exec(color))) { // rgba(255, 0, 0, 0.5)
            return this.rgbToObj(m[1], m[2], m[3], m[4]);
        } else if ((m = reRgbaPercent.exec(color))) {  // rgba(100%, 0%, 0%, .2)
            return this.rgbToObj(m[1] * 255 / 100, m[4] * 255 / 100, m[7] * 255 / 100, m[10]);
        } else if ((m = reHslPercent.exec(color))) {  // hsl(120, 50%, 50%)
            return this.hslToObj(m[1] / 360, m[2] / 100, m[5] / 100, 1);
        } else if ((m = reHslaPercent.exec(color))) {
            return this.hslToObj(m[1] / 360, m[2] / 100, m[5] / 100, m[10]); // hsla(120, 50%, 50%, 1)
        }else if((m = reHex3Length.exec(color))){
            return this.hexToRgb(m[1]+m[1],m[2]+m[2],m[3]+m[3]);
        }else if((m = reHex6Length.exec(color))){
            return this.hexToRgb(m[1],m[2],m[3]);
        }else if((m = reHex8Length.exec(color))){
            return this.hexToRgba(m[1],m[2],m[3],m[4]);
        } else {
            var colorHexFromName = this.getColorHexCode(color)
            if(colorHexFromName == null) {
                return this.rgbToObj(0,0,0,0);
            } else {
                return this.convert(colorHexFromName)
            }
        }
    };

    hexToRgba(r,g,b,a){
        return this.rgbToObj(parseInt(r,16),parseInt(g,16),parseInt(b,16),parseInt(a,16)/255)
    }

    hexToRgb(r,g,b){
        return this.rgbToObj(parseInt(r,16),parseInt(g,16),parseInt(b,16),1)
    }

    hslToObj(h,s,l, a) {
        let r, g, b;
        
        if(0 == s) {
          r = g = b = l; // achromatic
        }
        else {
        function hue2rgb(p, q, t) {
            if (t < 0) {
                t += 1;
            }
            if (t > 1) {
                t -= 1;
            }
            if (t < 1./6) {
                return p + (q - p) * 6 * t;
            }
            if (t < 1./2) {
                return q;
            }
            if (t < 2./3) {  
                return p + (q - p) * (2./3 - t) * 6;
            }
                
            return p;
        }
          const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
          const p = 2 * l - q;
          r = hue2rgb(p, q, h + 1.0/3.0);
          g = hue2rgb(p, q, h);
          b = hue2rgb(p, q, h - 1.0/3.0);
        }
      
        return this.rgbToObj(r * 255, g * 255, b * 255, a)
    }

    rgbToObj(r, g, b, a) {
        return {red: r ,green: g ,blue: b, alpha: a};
    };
    
    componentToHex(c) {
        var hex = c.toString(16);
        return (hex.length == 1 ? '0':'') + hex;
    };

    //Getting colors
    getRGB() {
        return "rgb(" + this.red + "," + this.green+"," + this.blue + ")"; //No I18N
    };

    getRGBA() {
        return "rgba(" + this.red+"," + this.green + "," + this.blue + "," + this.alpha + ")"; //No I18N
    };

    getHEX() {
        return '#' + this.componentToHex(this.red) + this.componentToHex(this.green) + this.componentToHex(this.blue);
    };

    getHEXWithAlpha(){
        return '#' + this.componentToHex(this.red) + this.componentToHex(this.green) + this.componentToHex(this.blue) + this.componentToHex(Math.round(this.alpha * 255));
    };

    getColorHexCode(colorName) {
        // Define a mapping of predefined color names to hexadecimal color codes
        const colorMap = {
            aliceblue: '#f0f8ff', //No I18N
            antiquewhite: '#faebd7', //No I18N
            aqua: '#00ffff', //No I18N
            aquamarine: '#7fffd4', //No I18N
            azure: '#f0ffff', //No I18N
            beige: '#f5f5dc', //No I18N
            bisque: '#ffe4c4', //No I18N
            black: '#000000', //No I18N
            blanchedalmond: '#ffebcd', //No I18N
            blue: '#0000ff', //No I18N
            blueviolet: '#8a2be2', //No I18N
            brown: '#a52a2a', //No I18N
            burlywood: '#deb887', //No I18N
            cadetblue: '#5f9ea0', //No I18N
            chartreuse: '#7fff00', //No I18N
            chocolate: '#d2691e', //No I18N
            coral: '#ff7f50', //No I18N
            cornflowerblue: '#6495ed', //No I18N
            cornsilk: '#fff8dc', //No I18N
            crimson: '#dc143c', //No I18N
            cyan: '#00ffff', //No I18N
            darkblue: '#00008b', //No I18N
            darkcyan: '#008b8b', //No I18N
            darkgoldenrod: '#b8860b', //No I18N
            darkgray: '#a9a9a9', //No I18N
            darkgreen: '#006400', //No I18N
            darkkhaki: '#bdb76b', //No I18N
            darkmagenta: '#8b008b', //No I18N
            darkolivegreen: '#556b2f', //No I18N
            darkorange: '#ff8c00', //No I18N
            darkorchid: '#9932cc', //No I18N
            darkred: '#8b0000', //No I18N
            darksalmon: '#e9967a', //No I18N
            darkseagreen: '#8fbc8f', //No I18N
            darkslateblue: '#483d8b', //No I18N
            darkslategray: '#2f4f4f', //No I18N
            darkturquoise: '#00ced1', //No I18N
            darkviolet: '#9400d3', //No I18N
            deeppink: '#ff1493', //No I18N
            deepskyblue: '#00bfff', //No I18N
            dimgray: '#696969', //No I18N
            dodgerblue: '#1e90ff', //No I18N
            firebrick: '#b22222', //No I18N
            floralwhite: '#fffaf0', //No I18N
            forestgreen: '#228b22', //No I18N
            fuchsia: '#ff00ff', //No I18N
            gainsboro: '#dcdcdc', //No I18N
            ghostwhite: '#f8f8ff', //No I18N
            gold: '#ffd700', //No I18N
            goldenrod: '#daa520', //No I18N
            gray: '#808080', //No I18N
            green: '#008000', //No I18N
            greenyellow: '#adff2f', //No I18N
            honeydew: '#f0fff0', //No I18N
            hotpink: '#ff69b4', //No I18N
            indianred: '#cd5c5c', //No I18N
            indigo: '#4b0082', //No I18N
            ivory: '#fffff0', //No I18N
            khaki: '#f0e68c', //No I18N
            lavender: '#e6e6fa', //No I18N
            lavenderblush: '#fff0f5', //No I18N
            lawngreen: '#7cfc00', //No I18N
            lemonchiffon: '#fffacd', //No I18N
            lightblue: '#add8e6', //No I18N
            lightcoral: '#f08080', //No I18N
            lightcyan: '#e0ffff', //No I18N
            lightgoldenrodyellow: '#fafad2', //No I18N
            lightgray: '#d3d3d3', //No I18N
            lightgreen: '#90ee90', //No I18N
            lightpink: '#ffb6c1', //No I18N
            lightsalmon: '#ffa07a', //No I18N
            lightseagreen: '#20b2aa', //No I18N
            lightskyblue: '#87cefa', //No I18N
            lightslategray: '#778899', //No I18N
            lightsteelblue: '#b0c4de', //No I18N
            lightyellow: '#ffffe0', //No I18N
            lime: '#00ff00', //No I18N
            limegreen: '#32cd32', //No I18N
            linen: '#faf0e6', //No I18N
            magenta: '#ff00ff', //No I18N
            maroon: '#800000', //No I18N
            mediumaquamarine: '#66cdaa', //No I18N
            mediumblue: '#0000cd', //No I18N
            mediumorchid: '#ba55d3', //No I18N
            mediumpurple: '#9370db', //No I18N
            mediumseagreen: '#3cb371', //No I18N
            mediumslateblue: '#7b68ee', //No I18N
            mediumspringgreen: '#00fa9a', //No I18N
            mediumturquoise: '#48d1cc', //No I18N
            mediumvioletred: '#c71585', //No I18N
            midnightblue: '#191970', //No I18N
            mintcream: '#f5fffa', //No I18N
            mistyrose: '#ffe4e1', //No I18N
            moccasin: '#ffe4b5', //No I18N
            navajowhite: '#ffdead', //No I18N
            navy: '#000080', //No I18N
            oldlace: '#fdf5e6', //No I18N
            olive: '#808000', //No I18N
            olivedrab: '#6b8e23', //No I18N
            orange: '#ffa500', //No I18N
            orangered: '#ff4500', //No I18N
            orchid: '#da70d6', //No I18N
            palegoldenrod: '#eee8aa', //No I18N
            palegreen: '#98fb98', //No I18N
            paleturquoise: '#afeeee', //No I18N
            palevioletred: '#db7093', //No I18N
            papayawhip: '#ffefd5', //No I18N
            peachpuff: '#ffdab9', //No I18N
            peru: '#cd853f', //No I18N
            pink: '#ffc0cb', //No I18N
            plum: '#dda0dd', //No I18N
            powderblue: '#b0e0e6', //No I18N
            purple: '#800080', //No I18N
            rebeccapurple: '#663399', //No I18N
            red: '#ff0000', //No I18N
            rosybrown: '#bc8f8f', //No I18N
            royalblue: '#4169e1', //No I18N
            saddlebrown: '#8b4513', //No I18N
            salmon: '#fa8072', //No I18N
            sandybrown: '#f4a460', //No I18N
            seagreen: '#2e8b57', //No I18N    
            seashell: '#fff5ee', //No I18N
            sienna: '#a0522d', //No I18N
            silver: '#c0c0c0', //No I18N
            skyblue: '#87ceeb', //No I18N
            slateblue: '#6a5acd', //No I18N
            slategray: '#708090', //No I18N
            snow: '#fffafa', //No I18N
            springgreen: '#00ff7f', //No I18N
            steelblue: '#4682b4', //No I18N
            tan: '#d2b48c', //No I18N
            teal: '#008080', //No I18N
            thistle: '#d8bfd8', //No I18N
            tomato: '#ff6347', //No I18N
            turquoise: '#40e0d0', //No I18N
            violet: '#ee82ee', //No I18N
            wheat: '#f5deb3', //No I18N
            white: '#ffffff', //No I18N
            whitesmoke: '#f5f5f5', //No I18N
            yellow: '#ffff00', //No I18N
            yellowgreen: '#9acd32' //No I18N
        };
    
        // Convert colorName to lowercase for case-insensitive comparison
        colorName = colorName.toLowerCase();
    
        // Check if the provided color name exists in the colorMap
        if (colorName in colorMap) {
            return colorMap[colorName];
        } else {
            // If color name doesn't exist, return null or handle the error as needed
            return null;
        }
    }
}