import { Scenes, session, Telegraf } from "telegraf";
import { config } from "./utils/config";
import { switchChain } from "./commands/switchChain";
import { currentChain } from "./commands/currentChain";
import { deposit } from "./commands/deposit";
import buyWizard from "./scenes/buyWizard";
import sellWizard from "./scenes/sellWizard";

export const bot = new Telegraf<Scenes.WizardContext>(config.telegramToken);

switchChain(bot);
currentChain(bot);
deposit(bot);

const stage = new Scenes.Stage<Scenes.WizardContext>([buyWizard, sellWizard]);
bot.use(session());
bot.use(stage.middleware());

bot.start(async (ctx) => await ctx.reply("Welcome"));

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
