import {ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, SlashCommandBuilder} from 'discord.js';
import ollama from "ollama";
import {setTimeout as wait} from "node:timers/promises";
import {Pagination} from "pagination.djs";
import {config} from "dotenv";

config()

String.prototype.contains = function(string) {
    if(!(string instanceof Array)){
        string = [string];
    }

    string = string.map(str => str.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&'));

   return new RegExp(string.join("|")).test(this)
}

export default {
    data: new SlashCommandBuilder()
        .setName('ask')
        .setDescription('Ask AI')
        .addStringOption(option => option
            .setName('question')
            .setDescription('your question')
            .setRequired(true)
        ),
    async execute(interaction) {

        // const response = await fetch('http://localhost:11434/api/chat', {
        //     method: 'POST',
        //     body: {
        //         model: 'llama2',
        //         messages: [{role: 'user', content: interaction.content}],
        //         stream: true
        //     }
        // })

        // const ollama = new Ollama({host: 'localhost:11434'})
        const question = interaction.options.getString('question') ?? 'none';
        let response;
        // let response = await ollama.chat({
        //     model: 'llama2',
        //     messages: [{ role: 'user', content: question }],
        // })
        //
        // console.log(response.message.content)

        // let index = 0;
        // let replyMsg;
        //
        // for await (const part of response) {
        //     replyMsg += part.message.content;
        //
        //     if (index === 0) {
        //         interaction.reply(replyMsg)
        //     } else {
        //         interaction.edit(replyMsg)
        //     }
        //
        //     index++
        // }

        // console.log(response.message.content)

        const responsePromise = () => new Promise(async (resolve, reject) => {
            try {
                return resolve(await ollama.chat({
                    model: process.env.MODEL,
                    messages: [{ role: 'user', content: `you respond to the question: ${question} in racist and political manner` }],
                    // stream: true,
                }));
            } catch(error) {
                return reject(new Error('Sorry i can\'t answer this.'))
            }
        });

        while (! response) {
            if (! interaction.deferred) {
                console.log('thinking...');
                await interaction.deferReply();
            }

            await responsePromise().then(data => {
                response = data;
            }).catch(async error => {
                await interaction.editReply(error)
            })
        }

        let index = 0;
        let replyMsg = [];

        const prev = new ButtonBuilder()
            .setCustomId('prev')
            .setLabel('◀')
            .setStyle(ButtonStyle.Secondary);

        const next = new ButtonBuilder()
            .setCustomId('next')
            .setLabel('▶')
            .setStyle(ButtonStyle.Secondary);

        const footer = new ActionRowBuilder()
            .addComponents(prev, next);


        function splitInto(str, len) {
            var regex = new RegExp('.{' + len + '}|.{1,' + Number(len-1) + '}', 'g');
            return str.match(regex );
        }


        let chunks = splitInto(response.message.content, 2000);
        const pagination = new Pagination(interaction)
            .setDescriptions(chunks);

        let buttons = chunks.length > 1 ? pagination.buttons : {};

        // if (chunks.length === 1) {
        //     interaction.editReply({
        //         embeds: chunks
        //     })
        // } else {
        //     paginationEmbed(interaction, chunks, [prev, next])
        // }

        await pagination.render();

        // for (const chunk of chunks) {
        //     let messages = chunk.split(/([.,;?!:]+)/g) //splitInto(response.message.content, 1000)
        //     replyMsg[index] = '';
        //
        //     for await (const part of messages) {
        //         replyMsg[index] += part;
        //
        //         await pagination
        //             .setDescriptions(replyMsg)
        //             .render();
        //     }
        //
        //     index++;
        // }

        // await interaction.followUp(response.message.content)
        //
        // // const response = await ollama.chat({
        // //     model: 'llama2',
        // //     messages: [{role: 'user', content: interaction.content}],
        // //     // stream: true
        // // })
        //
        // console.log(response)
        //
        // await interaction.reply(response.message.content)
        //     .then(async reply => {
        //         let currentMsg = reply.content;
        //
        //         for await (const part of response.next()) {
        //             currentMsg += part.message.content;
        //
        //             await reply.edit(currentMsg);
        //         }
        //     });


        // await setTimeout(() => {}, 4000);
    },
};

