import { generatePrivateKey, privateKeyToAddress } from "viem/accounts";
import prisma from "./prisma";

export const getGroupUser = async (groupId: string, telegramId: string) => {
  const existingGroupUser = await prisma.groupUser.findFirst({
    where: {
      groupId,
      telegramId,
    },
  });

  if (!existingGroupUser) {
    const result = await prisma.$transaction(async (tx) => {
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
          groupId,
          telegramId,
          walletId: wallet.id,
        },
      });

      return { groupUser, wallet };
    });

    return result;
  }

  const groupUser = await prisma.groupUser.findFirst({
    where: {
      groupId,
      telegramId,
    },
    include: {
      wallet: {
        include: {
          walletHolding: true,
        },
      },
    },
  });

  if (!groupUser) {
    throw new Error("group user not found.");
  }

  return groupUser;
};
