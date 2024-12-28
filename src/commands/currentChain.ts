import { Scenes, Telegraf } from "telegraf";
import { getGroup } from "../lib/get-group";
import { getChain } from "../lib/get-chain";

export const currentChain = (bot: Telegraf<Scenes.WizardContext>) =>
  bot.command("currentChain", async (ctx) => {
    const gorup = await getGroup(ctx.chat.id.toString());
    const chain = getChain(gorup.chainId);

    await ctx.reply(`Current chain: ${chain.name}`);
  });
