import prisma from "./prisma";

export const getGroup = async (telegramId: string) => {
  const group = await prisma.group.findFirst({
    where: {
      telegramId: telegramId,
    },
    include: {
      wallet: {
        include: {
          walletHolding: true,
        },
      },
      groupUser: {
        include: {
          wallet: {
            include: {
              walletHolding: true,
            },
          },
        },
      },
    },
  });

  if (!group) {
    throw new Error("");
  }

  return group;
};
