const { canvasText } = require("./text");

function drawLineChart(ctx, messageData, voiceData, x, y, width, height) {
    if (messageData.length < 2 || voiceData < 2) return;
    if(messageData.length !== voiceData.length)
        return console.error("messageData et voiceData doivent être de même longueur.");

    const dataLength = messageData.length;

    const maxMessage = Math.max(...messageData);
    const minMessage = 0;
    const rangeMessage = Math.max(maxMessage - minMessage, 1);

    const maxVoice = Math.max(...voiceData);
    const minVoice = 0;
    const rangeVoice = Math.max(maxVoice - minVoice, 1);

    const lastfillStyle = ctx.fillStyle;

    if(maxMessage !== maxVoice){
        if(maxMessage !== minMessage){
            ctx.fillStyle = "#3CB44BFF";
            canvasText(ctx, maxMessage.toString(), 20, [x,y-12.5], 25);
        }
        
        if(maxVoice !== minVoice){
            ctx.fillStyle = "#D45087FF";
            canvasText(ctx, maxVoice.toString(), 20, [x,y+12.5], 25);
        }
    }
    else if(maxMessage !== 0){
        ctx.fillStyle = "#ffffff";
        canvasText(ctx, maxMessage.toString(), 20, [x, y], 25);
    }

    ctx.fillStyle = "#ffffff";
    canvasText(ctx, minMessage.toString(), 20, [x, y+height], 25);
    canvasText(ctx, `${dataLength}j`, 20, [x+width+25, y+height], 25);
    

    const lastStrokeStyle = ctx.strokeStyle;
    ctx.strokeStyle = "#ffffff";

    x+=5
    width-=5

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + height);
    ctx.lineTo(x + width, y + height);
    ctx.stroke();

    // Messages
    ctx.fillStyle = "#3CB44BFF";
    ctx.strokeStyle = "#3CB44BFF";

    const stepXMessage = width / (messageData.length - 1);

    // Courbe
    ctx.beginPath();

    messageData.forEach((value, i) => {
        const px = x + i * stepXMessage;
        const py = y + height - ((value - minMessage) / rangeMessage) * height;

        if (i === 0) {
            ctx.moveTo(px, py);
        } else {
            ctx.lineTo(px, py);
        }
    });

    ctx.stroke();

    // Points
    messageData.forEach((value, i) => {
        const px = x + i * stepXMessage;
        const py = y + height - ((value - minMessage) / rangeMessage) * height;

        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fill();
    });

    const stepXVoice = width / (voiceData.length - 1);

    // Vocal

    ctx.fillStyle = "#D45087FF";
    ctx.strokeStyle = "#D45087FF";
    // Courbe
    ctx.beginPath();

    voiceData.forEach((value, i) => {
        const px = x + i * stepXVoice;
        const py = y + height - ((value - minVoice) / rangeVoice) * height;

        if (i === 0) {
            ctx.moveTo(px, py);
        } else {
            ctx.lineTo(px, py);
        }
    });

    ctx.stroke();

    // Points
    voiceData.forEach((value, i) => {
        const px = x + i * stepXVoice;
        const py = y + height - ((value - minVoice) / rangeVoice) * height;

        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fill();
    });

    ctx.fillStyle = lastfillStyle;
    ctx.strokeStyle = lastStrokeStyle;
}

module.exports = {
    drawLineChart
}