const fontkit = require("fontkit");
const { registerFont } = require("canvas");

registerFont("./NotoSans.ttf", {
    family: "NotoSans"
});

const font = fontkit.openSync("./NotoSans.ttf");

function normalizeText(text) {
    var output = "";
    for (const char of text) {
        const glyph = font.glyphForCodePoint(char.codePointAt(0));

        // glyph id 0 = caractère absent
        if (glyph.id === 0) {
            const normalizedChar = char.normalize("NFKD")
            const normalizedGlyph = font.glyphForCodePoint(normalizedChar.codePointAt(0));
            
            if(normalizedGlyph.id !== 0) {
                output = output + normalizedChar
            }
        }
        else {
            output = output + char
        }
    }

    return output;
}

function canvasText(ctx, text, fontSize, position, maxWidth){
    text = normalizeText(text);
    do {
        ctx.font = `${fontSize}px NotoSans`;
        fontSize--;
    } while (ctx.measureText(text).width > maxWidth && fontSize > 10);

    ctx.fillText(text, position[0], position[1]);
}

module.exports = {
    canvasText
}