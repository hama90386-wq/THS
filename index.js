const { 
  Client, 
  GatewayIntentBits, 
  PermissionsBitField, 
  REST, 
  Routes, 
  SlashCommandBuilder 
} = require('discord.js');

const fs = require('fs');
require('dotenv').config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const FILE = "bank.json";
let data = {};

// تحميل البيانات
if (fs.existsSync(FILE)) {
  data = JSON.parse(fs.readFileSync(FILE));
}

// حفظ البيانات
function save() {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

// إنشاء حساب
function createAccount(id) {
  if (!data[id]) {
    data[id] = {
      balance: 0,
      lastDaily: 0
    };
  }
}

// عند تشغيل البوت
client.once("ready", async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

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
        option.setName("user")
          .setDescription("الشخص")
          .setRequired(true))
      .addIntegerOption(option =>
        option.setName("amount")
          .setDescription("المبلغ")
          .setRequired(true)),

    new SlashCommandBuilder()
      .setName("give")
      .setDescription("إعطاء فلوس (أدمن فقط)")
      .addUserOption(option =>
        option.setName("user")
          .setDescription("الشخص")
          .setRequired(true))
      .addIntegerOption(option =>
        option.setName("amount")
          .setDescription("المبلغ")
          .setRequired(true)),

    new SlashCommandBuilder()
      .setName("leaderboard")
      .setDescription("أغنى 10 أعضاء")
  ];

  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

  try {
    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: commands }
    );
    console.log("✅ تم تسجيل أوامر السلاش");
  } catch (error) {
    console.error(error);
  }
});

// الأوامر
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;
  const user = interaction.user;

  createAccount(user.id);

  // /balance
  if (commandName === "balance") {
    return interaction.reply(`💰 رصيدك: ${data[user.id].balance} Coins`);
  }

  // /daily
  if (commandName === "daily") {
    const now = Date.now();
    const cooldown = 24 * 60 * 60 * 1000;

    if (now - data[user.id].lastDaily < cooldown) {
      return interaction.reply({ 
        content: "⏳ تقدر تستلم بعد 24 ساعة", 
        ephemeral: true 
      });
    }

    data[user.id].balance += 500;
    data[user.id].lastDaily = now;
    save();

    return interaction.reply("🎁 استلمت 500 Coins");
  }

  // /pay
  if (commandName === "pay") {
    const target = interaction.options.getUser("user");
    const amount = interaction.options.getInteger("amount");

    if (amount <= 0)
      return interaction.reply({ 
        content: "❌ مبلغ غير صحيح", 
        ephemeral: true 
      });

    createAccount(target.id);

    if (data[user.id].balance < amount)
      return interaction.reply({ 
        content: "❌ ما عندك رصيد كافي", 
        ephemeral: true 
      });

    data[user.id].balance -= amount;
    data[target.id].balance += amount;
    save();

    return interaction.reply(`✅ حولت ${amount} Coins إلى ${target.username}`);
  }

  // /give
  if (commandName === "give") {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return interaction.reply({ 
        content: "❌ للأدمن فقط", 
        ephemeral: true 
      });

    const target = interaction.options.getUser("user");
    const amount = interaction.options.getInteger("amount");

    createAccount(target.id);
    data[target.id].balance += amount;
    save();

    return interaction.reply(`💸 تم إعطاء ${amount} Coins`);
  }

  // /leaderboard
  if (commandName === "leaderboard") {
    const sorted = Object.entries(data)
      .sort((a, b) => b[1].balance - a[1].balance)
      .slice(0, 10);

    let text = "🏆 أغنى 10 أعضاء:\n";

    for (let i = 0; i < sorted.length; i++) {
      const member = await client.users.fetch(sorted[i][0]);
      text += `${i + 1}. ${member.username} - ${sorted[i][1].balance} Coins\n`;
    }

    return interaction.reply(text);
  }
});

client.login(process.env.TOKEN);
