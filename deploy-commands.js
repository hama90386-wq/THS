const { REST, Routes, SlashCommandBuilder } = require('discord.js');
require('dotenv').config();

const commands = [
  new SlashCommandBuilder()
    .setName("balance")
    .setDescription("عرض رصيدك"),

  new SlashCommandBuilder()
    .setName("daily")
    .setDescription("استلام المكافأة اليومية"),

  new SlashCommandBuilder()
    .setName("pay")
    .setDescription("تحويل فلوس")
    .addUserOption(option =>
      option.setName("user").setDescription("الشخص").setRequired(true))
    .addIntegerOption(option =>
      option.setName("amount").setDescription("المبلغ").setRequired(true)),

  new SlashCommandBuilder()
    .setName("give")
    .setDescription("إعطاء فلوس (أدمن)")
    .addUserOption(option =>
      option.setName("user").setDescription("الشخص").setRequired(true))
    .addIntegerOption(option =>
      option.setName("amount").setDescription("المبلغ").setRequired(true)),
];

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log("🔄 تسجيل الأوامر...");
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );
    console.log("✅ تم تسجيل الأوامر");
  } catch (error) {
    console.error(error);
  }
})();