import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // -------------------------
  // Vegetables
  // -------------------------
  const vegetables = [
    { name: "Tomato", slug: "tomato" },
    { name: "Onion", slug: "onion" },
    { name: "Carrot", slug: "carrot" },
    { name: "Potato", slug: "potato" },
    { name: "Cabbage", slug: "cabbage" },
  ];

  for (const veg of vegetables) {
    await prisma.vegetable.upsert({
      where: { slug: veg.slug },
      update: {},
      create: {
        name: veg.name,
        slug: veg.slug,
        isActive: true,
      },
    });
  }

  // -------------------------
  // Locations (Macro level)
  // -------------------------
  const locations = [
    { province: "Western", district: "Colombo" },
    { province: "Western", district: "Gampaha" },
    { province: "Central", district: "Kandy" },
    { province: "Southern", district: "Galle" },
    { province: "Northern", district: "Jaffna" },
  ];

  for (const loc of locations) {
    await prisma.location.create({
      data: {
        province: loc.province,
        district: loc.district,
        city: null,
      },
    }).catch(() => {
      // Ignore duplicate inserts
    });
  }

  console.log("✅ Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });