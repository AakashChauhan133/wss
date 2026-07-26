import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Equivalent of data_link.py -> connect_dummy_data
 * Links (or creates) a device with id 1 to the first registered user, so
 * that dummy/simulator sensor readings have an owner to attach to.
 */
async function connectDummyData() {
  const myUser = await prisma.user.findFirst();
  if (!myUser) {
    console.log("No users found! Please register a user first.");
    return;
  }

  const device = await prisma.device.findFirst({ where: { id: 1 } });

  if (!device) {
    console.log(`Creating Device 1 and linking it to User: ${myUser.email}`);
    const newDevice = await prisma.device.create({
      data: {
        id: 1,
        deviceUid: "dummy-simulator-hub",
        deviceName: "Dummy Simulator Hub",
      },
    });
    await prisma.deviceUser.create({
      data: {
        userId: myUser.id,
        deviceId: newDevice.id,
        isOwner: true,
        role: "owner",
      },
    });
    console.log("Success! Dummy readings are now connected to your user.");
  } else {
    console.log(`Device 1 exists. Ensuring ownership by User: ${myUser.email}`);
    const existingLink = await prisma.deviceUser.findFirst({
      where: { deviceId: device.id, userId: myUser.id },
    });
    if (!existingLink) {
      await prisma.deviceUser.create({
        data: { userId: myUser.id, deviceId: device.id, isOwner: true, role: "owner" },
      });
    }
    console.log("Success! Ownership updated.");
  }
}

connectDummyData()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
