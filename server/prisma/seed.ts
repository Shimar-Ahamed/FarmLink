import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // -------------------------
  // Vegetables
  // -------------------------
  const vegetables = [
  {
    "name": "Asiatic Pennywort",
    "slug": "asiatic-pennywort" 
  },
  {
    "name": "Beetroot",
    "slug": "beetroot"
  },
  {
    "name": "Bitter Melon",     
    "slug": "bitter-melon"      
  },
  {
    "name": "Breadfruit",       
    "slug": "breadfruit"        
  },
  {
    "name": "Brinjal",
    "slug": "brinjal"
  },
  {
    "name": "Cabbage",
    "slug": "cabbage"
  },
  {
    "name": "Carrot",
    "slug": "carrot"
  },
  {
    "name": "Drumsticks",
    "slug": "drumsticks"
  },
  {
    "name": "Jackfruit",
    "slug": "jackfruit"
  },
  {
    "name": "Knol-Khol",
    "slug": "knol-khol"
  },
  {
    "name": "Leeks",
    "slug": "leeks"
  },
  {
    "name": "Long Purple Eggplant",
    "slug": "long-purple-eggplant"
  },
  {
    "name": "Manioc",
    "slug": "manioc"
  },
  {
    "name": "Onion",
    "slug": "onion"
  },
  {
    "name": "Pennywort",
    "slug": "pennywort"
  },
  {
    "name": "Potato",
    "slug": "potato"
  },
  {
    "name": "Pumpkin",
    "slug": "pumpkin"
  },
  {
    "name": "Red Spinach",
    "slug": "red-spinach"
  },
  {
    "name": "Taro",
    "slug": "taro"
  },
  {
    "name": "Winged Bean",
    "slug": "winged-bean"
  }
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