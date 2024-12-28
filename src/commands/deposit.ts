import { Markup, Scenes, Telegraf } from "telegraf";
import { getGroup } from "../lib/get-group";
import { getGroupUser } from "../lib/get-group-user";
import { getChain } from "../lib/get-chain";
import { getPublicClient } from "../lib/get-public-client";
import { Address, formatEther } from "viem";

export const deposit = (bot: Telegraf<Scenes.WizardContext>) => {
  bot.command("deposit", async (ctx) => {
    try {
      const group = await getGroup(ctx.chat.id.toString());
      const user = await getGroupUser(group.id, ctx.from.id.toString());

      const chain = getChain(group.chainId);

      const client = getPublicClient(chain);

      const balance = await client.getBalance({
        address: user.wallet.address as Address,
      });

      await ctx.reply(
        `🏦 Your deposit address on Sepolia:\n\n` +
          `\`${user.wallet.address}\`\n\n` +
          `💰 Balance: ${formatEther(balance)} ${
            chain.nativeCurrency.symbol
          }\n\n` +
          `✅ Send tokens to this address to deposit them into your account.\n` +
          `⚠️ Only send tokens on supported networks!`,
        {
          parse_mode: "Markdown",
          ...Markup.inlineKeyboard([
            [
              Markup.button.url(
                "View on Blockscout",
                `${chain.blockExplorers.default.url}/address/${user.wallet.address}`
              ),
              Markup.button.callback("Refresh", `refresh`),
              Markup.button.callback("✅ Done", "deposit_done"),
            ],
          ]),
        }
      );
    } catch (error) {
      console.error("Error in deposit command:", error);

      await ctx.reply(
        "❌ Sorry, there was an error processing your request. Please try again later."
      );
    }
  });
};
