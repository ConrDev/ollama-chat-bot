import {Collection, Events } from "discord.js";
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';

import commandsList from "./index.js";
import {config} from "dotenv";

config();

function initialize(client) {
    client.commands = new Collection();

    for (let [name, command] of Object.entries(commandsList)) {
        // Set a new item in the Collection with the key as the command name and the value as the exported module
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
            console.log(`[SUCCESS] The command ${name} is loaded!`);
        } else {
            console.log(`[WARNING] The command ${name} is missing a required "data" or "execute" property.`);
        }
    }
}

function handle(client) {
    client.on(Events.InteractionCreate, async interaction => {
        if (!interaction.isChatInputCommand()) return;
        const command = interaction.client.commands.get(interaction.commandName);

        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({
                    content: 'There was an error while executing this command!',
                    ephemeral: true
                });
            } else {
                await interaction.reply({content: 'There was an error while executing this command!', ephemeral: true});
            }
        }
    })

}

/**
 *
 * @param client
 */
function deploy(client) {
    const commands = [];
    // Grab all the command folders from the commands directory you created earlier
    for (let [name, command] of Object.entries(commandsList)) {
        if ('data' in command && 'execute' in command) {
            commands.push(command.data.toJSON());
        } else {
            console.log(`[WARNING] The command ${name} is missing a required "data" or "execute" property.`);
        }
    }

// Construct and prepare an instance of the REST module
    const rest = new REST().setToken(process.env.TOKEN);

// and deploy your commands!
    (async () => {
        try {

            for (const [id, guild] of (await client.guilds.fetch()).entries()) {
                console.log(`[${id}] Started refreshing ${commands.length} application (/) commands.`);

                //The put method is used to fully refresh all commands in the guild with the current set
                const data = await rest.put(
                    Routes.applicationGuildCommands(process.env.CLIENT_ID, id),
                    {body: commands},
                );

                console.log(`[${id}] Successfully reloaded ${data.length} application (/) commands.`);
            }


        } catch (error) {
            // And of course, make sure you catch and log any errors!
            console.error(error);
        }
    })();
}

export {
    initialize,
    handle,
    deploy,
}