import {Client, Collection, EmbedBuilder, EmbedBuilder as MessageEmbed, Events, GatewayIntentBits} from 'discord.js';
import {config} from "dotenv";
import * as commandsModule from './commands/module.js';
import ollama from 'ollama';
import fetch, {Response} from "node-fetch";

import {setTimeout as wait} from "node:timers/promises";
// import {PassThrough} from "node:stream";

// PassThrough.prototype.getReader = function () {
//     return ReadableStream.from(this).getReader();
// }

config()

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
// const ollama = new Ollama({fetch})

commandsModule.initialize(client);

// When the client is ready, run this code (only once).
// The distinction between `client: Client<boolean>` and `readyClient: Client<true>` is important for TypeScript developers.
// It makes some properties non-nullable.
client.once(Events.ClientReady, async readyClient => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

commandsModule.handle(client);

// Log in to Discord with your client's token
client.login(process.env.TOKEN)
    .then(async () => {

        commandsModule.deploy(client)
        // for (const progress of response) {
        //     let msgEmbed = new MessageEmbed()
        //         .setTitle(model)
        //         .setDescription()
        //         .setColor((await progress).completed)
        //         .setFooter({ text: `As of ${bTime} UTC. In the last 24 Hours` })
        //
        //     message.edit(percentage.)
        // }
    })
    .finally(async () => {

    });

client.on(Events.Error, async Error => {
    console.log(Error);
})
client.on(Events.GuildAvailable, async Guild => {
    const channel = Guild.systemChannel;

    let message = await channel.send('loading model...');
    const model = process.env.MODEL;

    const response = await ollama.pull({
        model: model,
        stream: true
    });

    let currentDigestDone = false

    for await (const part of response) {
        let msgEmbed;

        if (part.digest) {
            let percent = 0
            if (part.completed && part.total) {
                percent = Math.round((part.completed / part.total) * 100)

                console.log(`pulling model: ${percent}%`)
            }
            msgEmbed = new EmbedBuilder()
                .setTitle(`${part.status}`)
                .setDescription(`${percent}%`)
            // .setFooter({ text: `As of ${bTime} UTC. In the last 24 Hours` })
            if (percent === 100 && !currentDigestDone) {
                msgEmbed.setColor('#008000')
                currentDigestDone = true
            } else {
                msgEmbed.setColor('#FFA500')
                currentDigestDone = false
            }
        } else {
            msgEmbed = new EmbedBuilder()
                .setTitle(model)
                .setDescription('Loaded')
                .setColor('#008000')
        }

        await message.edit({
            embeds: [msgEmbed]
        })
        //
        // if (! part.digest && part.completed) {
        //     wait(4000);
        //     await message.delete();
        // }
    }
})

export { client }