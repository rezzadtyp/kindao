import { Context } from "telegraf";
import prisma from "./prisma";
import { generatePrivateKey, privateKeyToAddress } from "viem/accounts";

export const getUserWallet = async (ctx: Context) => {
  const group = await prisma.group.findUnique({
    where: {
      telegramId: ctx.chat!.id.toString(),
    },
  });

  if (!group) {
    throw new Error("Group not found.");
  }

  const join = await prisma.groupUser.findFirst({
    where: {
      group: {
        telegramId: ctx.chat!.id.toString(),
      },
      telegramId: ctx.from!.id.toString(),
    },
    include: {
      group: true,
      wallet: true,
    },
  });

  if (!join) {
    return await prisma.$transaction(async (tx) => {
      const privateKey = generatePrivateKey();
      const address = privateKeyToAddress(privateKey);

      const wallet = await tx.wallet.create({
        data: {
          address,
          privateKey,
        },
      });

      const groupUser = await tx.groupUser.create({
        data: {
          groupId: group.id,
          telegramId: ctx.from!.id.toString(),
          walletId: wallet.id,
        },
      });

      return { groupUser, wallet };
    });
  }

  return {
    group: join.group,
    groupUser: join,
    wallet: join.wallet,
  };
};
