import { Scenes, session, Telegraf } from "telegraf";
import { config } from "./utils/config";
import { switchChain } from "./commands/switchChain";
import { currentChain } from "./commands/currentChain";
import { deposit } from "./commands/deposit";
import buyWizard from "./scenes/buyWizard";
import sellWizard from "./scenes/sellWizard";
import { holdings } from "./commands/holdings";
import { myChatMember } from "./events/my-chat-member";

export const bot = new Telegraf<Scenes.WizardContext>(config.telegramToken);

// EVENTS
myChatMember(bot);

// COMMANDS
holdings(bot);
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
