import { Scenes, Telegraf } from "telegraf";
import { getGroup } from "../lib/get-group";
import { getChain } from "../lib/get-chain";
import { NATIVE_TOKEN_ADDRESS } from "../lib/native-token-address";
import { formatUnits } from "viem";

export const holdings = (bot: Telegraf<Scenes.WizardContext>) => {
  bot.command("holdings", async (ctx) => {
    try {
      // Get the group information
      const group = await getGroup(ctx.chat.id.toString());

      if (!group) {
        await ctx.reply("Group not found.");
        return;
      }

      if (!group.wallet || !Array.isArray(group.wallet.walletHolding)) {
        await ctx.reply("No wallet holdings found for this group.");
        return;
      }

      // Get the chain information
      const chain = getChain(group.chainId);

      if (!chain) {
        await ctx.reply("Chain information not found.");
        return;
      }

      // Find the native holding
      const nativeHolding = group.wallet.walletHolding.find(
        (holding) =>
          holding.chainId === group.chainId &&
          holding.address === NATIVE_TOKEN_ADDRESS
      );

      if (!nativeHolding) {
        await ctx.reply("No native token holdings found.");
        return;
      }

      // Format the native balance
      const nativeBalance = formatUnits(
        BigInt(nativeHolding.amount ?? "0"),
        18
      );

      // Get other holdings on the same chain
      const otherBalances = group.wallet.walletHolding
        .filter(
          (holding) =>
            holding.chainId === group.chainId &&
            holding.address !== NATIVE_TOKEN_ADDRESS
        )
        .map(
          (holding) =>
            `Token: ${holding.address}\nBalance: ${formatUnits(
              BigInt(holding.amount),
              6
            )}`
        )
        .join("\n");

      // Reply with the formatted holdings
      await ctx.reply(
        [
          `🔗 Chain ID: ${group.chainId}`,
          `🏦 Native balance: ${nativeBalance} ${chain.nativeCurrency.symbol}`,
          otherBalances ? `🏦 Other balances:\n${otherBalances}` : "",
        ]
          .filter(Boolean)
          .join("\n\n")
      );
    } catch (error) {
      console.error("Error retrieving holdings:", error);
      await ctx.reply("An error occurred while retrieving holdings.");
    }
  });
};
