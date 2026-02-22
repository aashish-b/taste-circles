import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CATEGORIES = ["TV", "MOVIE", "MUSIC", "ANIME", "BOOK", "GAME"];

async function main() {
  const handle = process.env.DEV_USER_HANDLE ?? "me";
  const displayName = process.env.DEV_DISPLAY_NAME ?? "You";

  const user = await prisma.user.upsert({
    where: { handle },
    update: { displayName },
    create: {
      handle,
      displayName,
    },
  });

  await Promise.all(
    CATEGORIES.map((category) =>
      prisma.categoryListSettings.upsert({
        where: {
          userId_category: {
            userId: user.id,
            category,
          },
        },
        update: {},
        create: {
          userId: user.id,
          category,
          visibility: "PRIVATE",
          circleId: null,
          unlistedToken: null,
        },
      }),
    ),
  );

  console.log(`Seed complete for @${handle} (${user.id})`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
