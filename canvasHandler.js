import { registerFont, createCanvas, loadImage } from "canvas";
import { writeFileSync } from "fs";
import { openSync } from "fontkit";

function canvasText(ctx, text, fontSize, position, maxWidth){
    do {
        ctx.font = `${fontSize}px sans-serif`;
        fontSize--;
    } while (ctx.measureText(text).width > maxWidth && fontSize > 10);

    ctx.fillText(text, position[0], position[1]);
}

const canvas = createCanvas(1280, 708);
const ctx = canvas.getContext("2d");

var background = await loadImage("/home/zevier/Documents/Code/JavaScript/Bots/bot-crepe/userStatsTemplate.png");
ctx.drawImage(background, 0, 0, 1280, 708);


ctx.fillStyle = "#ffffff";
ctx.textAlign = "center";
ctx.textBaseline = "middle";

// Classement
canvasText(ctx, "#34", 50, [305, 230], 180)
canvasText(ctx, "#727", 50, [305, 325], 180)

// Messages
canvasText(ctx, "128 messages", 30, [680, 215], 270)
canvasText(ctx, "8542 messages", 30, [680, 275], 270)
canvasText(ctx, "46542 messages", 30, [680, 335], 270)

// Vocal
canvasText(ctx, "8 heures", 30, [1100, 215], 270)
canvasText(ctx, "25 heures", 30, [1100, 275], 270)
canvasText(ctx, "42 heures", 30, [1100, 335], 270)

// Salons
canvasText(ctx, "『👑』bots-staff", 30, [230, 477], 245)
canvasText(ctx, "〚🥞〛Salon de Crêpe", 30, [230, 537], 245)
canvasText(ctx, "〚🎮〛Crêpe gaming", 30, [230, 597], 245)

// Salons
canvasText(ctx, "8489 messages", 30, [487, 477], 250)
canvasText(ctx, "716 heures", 30, [487, 537], 250)
canvasText(ctx, "264 messages", 30, [487, 597], 250)

// écrire en PNG (test)
const buffer = canvas.toBuffer("image/png");
writeFileSync("output.png", buffer);