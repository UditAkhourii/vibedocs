
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    try {
        const user = await prisma.user.findFirst();
        if (!user) {
            console.log("No user found, can't test doc creation");
            return;
        }

        // updates test
        const doc = await prisma.document.findFirst({
            where: {
                repoName: "test-repo"
            }
        });
        console.log("Query with repoName successful (found or null):", doc);

    } catch (e) {
        console.error("FAIL: ", e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
