const { SlashCommandBuilder, EmbedBuilder, REST, Routes } = require('discord.js');
const fetchQuests = require('../scraper/fetchQuests');

const command = new SlashCommandBuilder()
  .setName('eventquests')
  .setDescription('Affiche les quêtes d’événements Monster Hunter Wilds');

async function registerCommands() {
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  await rest.put(
    Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
    { body: [command.toJSON()] }
  );
  console.log('✅ Commandes slash enregistrées.');
}

async function handleSlashCommand(interaction) {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== 'eventquests') return;

  await interaction.deferReply();

  // Supprimer les anciens messages du bot pour cette commande
  try {
    const messages = await interaction.channel.messages.fetch({ limit: 100 });

    const oldEventMessages = messages.filter(msg =>
      msg.author.id === interaction.client.user.id &&
      msg.embeds.length &&
      msg.embeds[0].title?.startsWith('📜 Quête événement :')
    );

    for (const msg of oldEventMessages.values()) {
      try {
        await msg.delete();
      } catch (err) {
        console.warn(`❗ Erreur suppression message ${msg.id} :`, err.message);
      }
    }
  } catch (err) {
    console.error('❌ Erreur lors de la récupération/suppression des anciens messages :', err);
  }

  // Récupérer les quêtes
  const quests = await fetchQuests();

  if (!quests.length) {
    return interaction.editReply('❌ Aucune quête trouvée ou une erreur est survenue.');
  }

  // Répondre avec un embed par quête
  for (const q of quests) {
    const embed = new EmbedBuilder()
      .setTitle(`📜 Quête événement : ${q.title}`)
      .setDescription(q.summary || 'Aucune description.')
      .addFields(
        { name: '🗺️ Région', value: q.region || 'Non précisé', inline: true },
        { name: '⚔️ Difficulté', value: q.difficulty || 'Non précisé', inline: true },
        { name: '📅 Début', value: q.start || 'Inconnu', inline: true },
        { name: '📅 Fin', value: q.end || 'Inconnu', inline: true },
        { name: '🎯 Conditions', value: q.conditions || 'Aucune', inline: false },
        { name: '✅ Objectif', value: q.completion || 'Non précisé', inline: false }
      )
      .setColor(0x6e2ca8)
      .setThumbnail(q.image || null);

    await interaction.followUp({ embeds: [embed] });
  }
}

module.exports = { handleSlashCommand, registerCommands };
