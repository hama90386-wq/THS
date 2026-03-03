const { Client, GatewayIntentBits, PermissionsBitField } = require('discord.js');
const fs = require('fs');
require('dotenv').config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const FILE = "bank.json";
let data = {};

if (fs.existsSync(FILE)) {
  data = JSON.parse(fs.readFileSync(FILE));
}

function save() {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

function createAccount(id) {
  if (!data[id]) {
    data[id] = { balance: 0, lastDaily: 0 };
  }
}

client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

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
      return interaction.reply({ content: "⏳ تقدر تستلم بعد 24 ساعة", ephemeral: true });
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
      return interaction.reply({ content: "❌ مبلغ غير صحيح", ephemeral: true });

    createAccount(target.id);

    if (data[user.id].balance < amount)
      return interaction.reply({ content: "❌ ما عندك رصيد كافي", ephemeral: true });

    data[user.id].balance -= amount;
    data[target.id].balance += amount;
    save();

    return interaction.reply(`✅ حولت ${amount} Coins إلى ${target.username}`);
  }

  // /give (للأدمن)
  if (commandName === "give") {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return interaction.reply({ content: "❌ للأدمن فقط", ephemeral: true });

    const target = interaction.options.getUser("user");
    const amount = interaction.options.getInteger("amount");

    createAccount(target.id);
    data[target.id].balance += amount;
    save();

    return interaction.reply(`💸 تم إعطاء ${amount} Coins`);
  }
});

client.login(process.env.TOKEN);
