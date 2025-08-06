require('dotenv').config();
const { Client, GatewayIntentBits, REST, Routes } = require('discord.js');
const cron = require('node-cron');
const { handleSlashCommand, registerCommands } = require('./commands/eventQuests');
const { postQuests } = require('./scraper/fetchQuests');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', async () => {
  console.log(`✅ Connecté en tant que ${client.user.tag}`);
  await registerCommands();

  // Tâche automatique hebdomadaire
  const channel = await client.channels.fetch(process.env.CHANNEL_ID);
  cron.schedule('0 10 * * 1', () => postQuests(channel)); // chaque lundi 10h
});

client.on('interactionCreate', async (interaction) => {
    try {
      await handleSlashCommand(interaction);
    } catch (err) {
      console.error('Erreur dans handleSlashCommand:', err);
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp({ content: '❌ Une erreur est survenue.', ephemeral: true });
      } else {
        await interaction.reply({ content: '❌ Une erreur est survenue.', ephemeral: true });
      }
    }
});

client.login(process.env.DISCORD_TOKEN);
