import { Scenes, session, Telegraf } from "telegraf";
import { config } from "./utils/config";
import { switchChain } from "./commands/switchChain";
import { currentChain } from "./commands/currentChain";
import { deposit } from "./commands/deposit";
import buyWizard from "./scenes/buyWizard";
import sellWizard from "./scenes/sellWizard";
import { holdings } from "./commands/holdings";
import { myChatMember } from "./events/my-chat-member";
import { refresh } from "./actions/refresh";
import { switchId } from "./actions/switch-id";
import { depositDone } from "./actions/deposit-done";

export const bot = new Telegraf<Scenes.WizardContext>(config.telegramToken);

// EVENTS
myChatMember(bot);

// COMMANDS
holdings(bot);
switchChain(bot);
currentChain(bot);
deposit(bot);

// ACTIONS
refresh(bot);
depositDone(bot);
switchId(bot);

const stage = new Scenes.Stage<Scenes.WizardContext>([buyWizard, sellWizard]);
bot.use(session());
bot.use(stage.middleware());

bot.command("start", async (ctx) => {
  await ctx.reply(
    "Welcome to MiniDAO Bot! 🤖\n\n" +
      "/deposit - Get deposit address\n" +
      "/block - Get latest block number\n" +
      "/buy - Buy a token\n" +
      "/sell - Sell a token\n" +
      "/holdings - Check your holdings\n" +
      "/gas - Get current gas price\n" +
      "/help - Show this help message"
  );
});

bot.command("help", async (ctx) => {
  await ctx.reply(
    "Available commands:\n" +
      "/deposit - Get deposit address\n" +
      "/block - Get latest block number\n" +
      "/buy - Buy a token\n" +
      "/sell - Sell a token\n" +
      "/holdings - Check your holdings\n" +
      "/gas - Get current gas price"
  );
});


bot.launch();

bot.command("buy", (ctx: Scenes.WizardContext) =>
  ctx.scene.enter("buy-wizard")
);
bot.command("sell", (ctx: Scenes.WizardContext) =>
  ctx.scene.enter("sell-wizard")
);

bot.command("hey", async (ctx) => await ctx.reply("Hello too"));

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
