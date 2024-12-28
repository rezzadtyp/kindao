import { Markup, Scenes, Telegraf } from "telegraf";
import { chunk } from "../utils/chunk";
import { chains } from "../lib/chains";

export const switchChain = (bot: Telegraf<Scenes.WizardContext>) =>
  bot.command("switchChain", async (ctx) => {
    await ctx.reply(
      "Select a network",
      Markup.inlineKeyboard(
        chunk(
          chains.map((chain) =>
            Markup.button.callback(chain.name, `switch_${chain.id.toString()}`)
          ),
          3
        )
      )
    );
  });
