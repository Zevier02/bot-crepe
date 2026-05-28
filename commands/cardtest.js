const Config = require("../config.json");
const fs = require("fs");
const fontkit = require("fontkit");
const Canvas = require("canvas");
const Discord = require(Config.ddiscordjs);

Canvas.registerFont("./RubikVar.ttf", {
    family: "RubikVar"
});

const font = fontkit.openSync("./RubikVar.ttf");

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

module.exports = {
    data: new Discord.SlashCommandBuilder()
        .setName("cardtest"),
    async execute(interaction){
        if(!interaction.isCommand) return;
        const text = normalizeText(interaction.options.get("pseudo").value);

        if(!interaction.member.permissions.has(Discord.PermissionsBitField.Flags.Administrator)){
            const embed = new Discord.EmbedBuilder()
                .setColor("Red")
                .setTitle("Cardtest")
                .setDescription(`Tu n'as pas les permissions d'utiliser cette commande.`)
                .setTimestamp()
                .setFooter({text : `Utilisé par : ${interaction.user.tag}`});
            return interaction.editReply({ embeds: [embed] })
        }

        const color = `${Math.floor(Math.random() * 10) == 0 ? "#ffff00" : "#ffffff"}`;
        var canvas = Canvas.createCanvas(1000, 300);
                    
        const ctx = canvas.getContext("2d");
                    
        var background = await Canvas.loadImage(Config.background);
        ctx.drawImage(background, 0, 0, 1000, 300);
        
        ctx.font = "50px RubikVar";
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "left";
        ctx.fillText("Bienvenue à", 400, 100);
        ctx.fillText("la nouvelle crêpe", 400, 150);
        ctx.font = "75px RubikVar";
        ctx.fillStyle = color
        ctx.textAlign = "left";

        const maxWidth = 550; // largeur max autorisée
        let fontSize = 75;

        // Réduit la taille jusqu'à ce que le texte rentre
        do {
            ctx.font = `${fontSize}px Arial`;
            fontSize--;
        } while (ctx.measureText(text).width > maxWidth && fontSize > 10);


        ctx.fillText(text, 400, 225);
        
        ctx.beginPath();
        ctx.arc(230, 150, 100, 0, Math.PI * 2)
        ctx.closePath();
        ctx.clip();
        
        var avatar = await Canvas.loadImage(interaction.user.avatarURL({ extension: 'png', size: 1024 }));
        
        ctx.drawImage(avatar, 130, 50, 200, 200);
                    
        var attachment = new Discord.AttachmentBuilder(canvas.toBuffer(), { name: 'welcome.png' });
        const embed = new Discord.EmbedBuilder()
            .setTitle("Une nouvelle crêpe est arrivée !")
            .setDescription("🥞Bienvenue à la nouvelle Crêpe !🥞")
            .setColor(color)
            .setImage('attachment://welcome.png')


        interaction.editReply({ embeds: [embed], files: [attachment] });
    }
}