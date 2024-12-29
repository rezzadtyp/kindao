import { Scenes, Telegraf } from "telegraf";
import { pendingTransactions } from "../types/pending-transactions";
import { getGroup } from "../lib/get-group";
import { getChain } from "../lib/get-chain";
import { getGroupWallet } from "../lib/get-group-wallet";
import { Address, parseUnits } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import prisma from "../lib/prisma";

export const handlePoll = (bot: Telegraf<Scenes.WizardContext>) => {
  bot.on("poll", async (ctx) => {
    const poll = ctx.poll;
    const txDetails = pendingTransactions.get(poll.id);

    const yesVotes = poll.options[0].voter_count;
    const totalVotes = poll.total_voter_count;
    console.log(
      "🚀 ~ bot.on ~ yesVotes:",
      yesVotes,
      totalVotes,
      txDetails,
      ctx.chat
    );

    if (txDetails) {
      const group = await getGroup(txDetails.chatId.toString());

      const chain = getChain(group.chainId);

      if (totalVotes >= 2) {
        if (yesVotes >= 2) {
          // Majority approved - execute transaction
          console.log("Executing transaction:", {
            chain: txDetails.chain,
            tokenAddress: txDetails.tokenAddress,
            amount: txDetails.amount,
          });
          const { wallet } = await getGroupWallet(txDetails.chatId);
          console.log(
            "🚀 ~ bot.on ~ wallet:",
            wallet,
            parseUnits(parseInt(txDetails.amount).toString(), 6).toString()
          );
          if (txDetails.type === "buy") {
            await ctx.telegram.sendMessage(txDetails.chatId, "Buying...");
            await buy({
              account: privateKeyToAccount(wallet?.privateKey as Address),
              chain,
              token: txDetails.tokenAddress,
              amount: parseUnits(txDetails.amount.toString(), 18).toString(),
            });

            const amount =
              BigInt(parseUnits(txDetails.amount.toString(), 18).toString()) /
              10n ** 14n;

            await prisma.walletHolding.upsert({
              where: {
                walletId: group?.wallet?.id,
                chainId: chain.id,
                address: txDetails.tokenAddress,
              },
              update: {
                amount: { increment: amount },
              },
              create: {
                walletId: group?.wallet?.id || "",
                chainId: chain.id,
                address: txDetails.tokenAddress,
                amount: amount,
              },
            });
          } else if (txDetails.type === "sell") {
            await ctx.telegram.sendMessage(txDetails.chatId, "Selling...");

            await sell({
              account: privateKeyToAccount(wallet?.privateKey as Address),
              chain,
              token: txDetails.tokenAddress,
              amount: parseUnits(txDetails.amount.toString(), 6).toString(),
            });

            await prisma.walletHolding.update({
              where: {
                walletId: group?.wallet?.id,
                chainId: chain.id,
                address: txDetails.tokenAddress,
              },
              data: {
                amount: {
                  decrement: parseUnits(txDetails.amount.toString(), 6),
                },
              },
            });
          }
          await ctx.telegram.sendMessage(
            txDetails.chatId,
            "✅ Transaction approved and executed!"
          );
          pendingTransactions.delete(poll.id);
        } else {
          await ctx.telegram.sendMessage(
            txDetails.chatId,
            "❌ Transaction rejected by voters."
          );
          pendingTransactions.delete(poll.id);
        }
      }
    }
  });
};
