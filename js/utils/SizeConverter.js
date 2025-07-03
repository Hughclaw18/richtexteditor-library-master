// 1in = 2.54cm = 25.4mm = 72pt = 864pc = ppi*1px
let converter = function (str) {
    var value = parseFloat(str);
    var units = { inches: value, pixels: value, centimeters: value, millimeters: value, points: value, picas: value };
    if (!/^[-+0-9]/.test(str) || !/px|in|cm|mm|rem|em|pt|pc$/i.test(str)) {
        return units;
    }

    var ppi = 96;
    if (/px$/i.test(str)) {
        // 1/ppi in = 2.54/ppi cm = 25.4/ppi mm = 72/ppi pt = 864/ppi pc = 1px
        units.inches *= 1 / ppi;
        units.centimeters *= 2.54 / ppi;
        units.millimeters *= 25.4 / ppi;
        units.points *= 72 / ppi;
        units.picas *= 864 / ppi;
    } else if (/vmin$/i.test(str)) {
        //added to differ between in and vmin
        return units;
    } else if (/in$/i.test(str)) {
        // 1 in = 2.54 cm = 25.4 mm = 72 pt = 864 pc = ppi px
        units.centimeters *= 2.54;
        units.millimeters *= 25.4;
        units.points *= 72;
        units.picas *= 864;
        units.pixels *= ppi;
    } else if (/cm$/i.test(str)) {
        // 1/2.54 in = 2.54/2.54 cm = 25.4/2.54 mm = 72/2.54 pt = 864/2.54 pc = ppi/2.54 px
        units.inches *= 1 / 2.54;
        units.millimeters *= 10;
        units.points *= 72 / 2.54;
        units.picas *= 864 / 2.54;
        units.pixels *= ppi / 2.54;
    } else if (/mm$/i.test(str)) {
        // 1/25.4 in = 2.54/25.4 cm = 25.4/25.4 mm = 72/25.4 pt = 864/25.4 pc = ppi/25.4 px
        units.inches *= 1 / 25.4;
        units.centimeters *= 0.1;
        units.points *= 72 / 25.4;
        units.picas *= 864 / 25.4;
        units.pixels *= ppi / 25.4;
    } else if (/pt$/i.test(str)) {
        // 1/72 in = 2.54/72 cm = 25.4/72 mm = 72/72 pt = 864/72 pc = ppi/72 px
        units.inches *= 1 / 72;
        units.centimeters *= 2.54 / 72;
        units.millimeters *= 25.4 / 72;
        units.picas *= 12;
        units.pixels *= ppi / 72;
    } else if (/pc$/i.test(str)) {
        // 1/864 in = 2.54/864 cm = 25.4/864 mm = 72/864 pt = 864/864 pc = ppi/864 px
        units.inches *= 1 / 864;
        units.centimeters *= 2.54 / 864;
        units.millimeters *= 25.4 / 864;
        units.points *= 12;
        units.pixels *= ppi / 864;
    } else if (/rem$/i.test(str)) {
        units.points *= 10;
    } else if (/em$/i.test(str)) {
        units.points *= 10;
    }
    //units.pixels = Math.round(units.pixels);
    return units;
}

export default converter