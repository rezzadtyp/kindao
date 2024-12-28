import { Scenes, Telegraf } from "telegraf";
import { getChain } from "../lib/get-chain";
import prisma from "../lib/prisma";

export const switchId = (bot: Telegraf<Scenes.WizardContext>) =>
  bot.action(/^switch_(.+)$/, async (ctx) => {
    try {
      if (!ctx.chat) {
        throw new Error("chat not found");
      }

      const chain = getChain(parseInt(ctx.match[1]));

      await prisma.group.update({
        where: {
          telegramId: ctx.chat.id.toString(),
        },
        data: {
          chainId: chain.id,
        },
      });

      await ctx.editMessageText(`Switched to ${chain.name} network.`);
    } catch (error) {
      await ctx.reply(
        "❌ Sorry, there was an error processing your request. Please try again later."
      );
    }
  });
