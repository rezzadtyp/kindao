import { PrismaClient } from "@prisma/client";
import type { Scenes, Telegraf } from "telegraf";
import { Address, privateKeyToAccount } from "viem/accounts";
import { getGroup } from "../lib/get-group";
import { getGroupUser } from "../lib/get-group-user";
import { getChain } from "../lib/get-chain";
import { getPublicClient } from "../lib/get-public-client";
import { getWalletClient } from "../lib/get-wallet-client";
import { Hex } from "viem";
import { NATIVE_TOKEN_ADDRESS } from "../lib/native-token-address";

const prisma = new PrismaClient();

export const depositDone = (bot: Telegraf<Scenes.WizardContext>) =>
  bot.action("deposit_done", async (ctx) => {
    try {
      if (!ctx.chat) {
        throw new Error("Chat not found.");
      }

      const group = await getGroup(ctx.chat.id.toString());
      const user = await getGroupUser(group.id, ctx.from.id.toString());

      const chain = getChain(group.chainId);

      const publicClient = getPublicClient(chain);

      const balance = await publicClient.getBalance({
        address: user.wallet.address as Address,
      });

      console.log("🚀 ~ bot.action ~ balance:", balance);

      const gasPrice = await publicClient.getGasPrice();

      console.log("🚀 ~ bot.action ~ gasPrice:", gasPrice);

      const walletClient = getWalletClient(
        chain,
        privateKeyToAccount(user.wallet.privateKey as Hex)
      );

      const depositAmount = balance - BigInt(gasPrice) * 30000n;
      console.log("🚀 ~ bot.action ~ depositAmount:", depositAmount);

      const hash = await walletClient.sendTransaction({
        to: group.wallet?.address as Address,
        value: depositAmount,
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      if (receipt.status !== "success") {
        throw new Error("Transaction not successful.");
      }

      await prisma.$transaction(async (tx) => {
        await tx.walletHolding.upsert({
          where: {
            walletId: user.wallet.id,
            chainId: chain.id,
            address: NATIVE_TOKEN_ADDRESS,
            amount: depositAmount,
          },
          update: {
            amount: {
              increment: depositAmount,
            },
          },
          create: {
            walletId: user.wallet.id,
            chainId: chain.id,
            address: NATIVE_TOKEN_ADDRESS,
            amount: depositAmount,
          },
        });

        await tx.walletHolding.upsert({
          where: {
            walletId: group.wallet?.id,
            chainId: chain.id,
            address: NATIVE_TOKEN_ADDRESS,
            amount: depositAmount,
          },
          update: {
            amount: {
              increment: depositAmount,
            },
          },
          create: {
            walletId: group.wallet?.id || "",
            chainId: chain.id,
            address: NATIVE_TOKEN_ADDRESS,
            amount: depositAmount,
          },
        });
      });

      console.log("🚀 ~ bot.action ~ wallet:", user.wallet.address);
      console.log("🚀 ~ bot.action ~ groupWallet:", group.wallet?.address);

      await ctx.reply("✅ Deposit done!");
    } catch (error) {
      console.error("Error processing deposit:", error);
      await ctx.reply(
        "❌ Sorry, there was an error processing your request. Please try again later."
      );
    }
  });
