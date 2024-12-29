import prisma from "./prisma";

export const getGroupWallet = async (chatId: number) => {
  console.log("🚀 ~ getGroupWallet ~ chatId:", chatId);

  const group = await prisma.group.findUnique({
    where: {
      telegramId: chatId.toString(),
    },
  });

  if (!group) {
    throw new Error("Group not found.");
  }

  return await (async () => {
    const join = await prisma.groupUser.findFirst({
      where: {
        group: {
          telegramId: chatId.toString(),
        },
        telegramId: chatId.toString(),
      },
      include: {
        group: true,
        wallet: true,
      },
    });

    return {
      group: join?.group,
      wallet: join?.wallet,
    };
  })();
};
