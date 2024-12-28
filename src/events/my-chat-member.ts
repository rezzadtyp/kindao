import { Scenes, Telegraf } from "telegraf";
import prisma from "../lib/prisma";
import { generatePrivateKey, privateKeyToAddress } from "viem/accounts";
import { polygonZkEvmCardona } from "viem/chains";

export const myChatMember = (bot: Telegraf<Scenes.WizardContext>) =>
  bot.on("my_chat_member", async (ctx) => {
    const { new_chat_member } = ctx.update.my_chat_member;

    if (new_chat_member && new_chat_member.user.id === ctx.botInfo.id) {
      if (new_chat_member.status === "member") {
        const existingGroup = await prisma.group.findUnique({
          where: {
            telegramId: ctx.chat.id.toString(),
          },
        });
        let group;

        if (existingGroup) {
          group = await prisma.group.update({
            where: {
              telegramId: ctx.chat.id.toString(),
            },
            data: {
              deletedAt: null,
            },
          });
        } else {
          const privateKey = generatePrivateKey();
          const address = privateKeyToAddress(privateKey);

          const wallet = await prisma.wallet.create({
            data: {
              address,
              privateKey,
            },
          });

          group = await prisma.group.create({
            data: {
              telegramId: ctx.chat.id.toString(),
              walletId: wallet.id,
              chainId: polygonZkEvmCardona.id,
            },
          });
        }

        console.log("joined", { group });

        await ctx.reply("🚀🌑");
      } else if (new_chat_member.status === "left") {
        const group = await prisma.group.update({
          where: {
            telegramId: ctx.chat.id.toString(),
          },
          data: {
            deletedAt: new Date(),
          },
        });

        console.log("left", { group });
      }
    }
  });
