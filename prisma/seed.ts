import "dotenv/config";
import { hash } from "bcryptjs";
import {
  ActivityType,
  PrismaClient,
  Role,
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Development seed must not run in production.");
  }

  const demoPassword = process.env.DEMO_PASSWORD;
  if (!demoPassword) {
    throw new Error("DEMO_PASSWORD is required. Add it to your .env file before running the seed.");
  }

  const passwordHash = await hash(demoPassword, 12);
  await prisma.authAttempt.deleteMany();
  const [employee, secondEmployee, support, secondSupport, manager] = await Promise.all([
    prisma.user.upsert({
      where: { email: "employee@helpdesklite.local" },
      update: { name: "Ahmed Saaied", role: Role.EMPLOYEE, active: true, passwordHash },
      create: { name: "Ahmed Saaied", email: "employee@helpdesklite.local", role: Role.EMPLOYEE, passwordHash },
    }),
    prisma.user.upsert({
      where: { email: "omar@helpdesklite.local" },
      update: { name: "Omar Khalil", role: Role.EMPLOYEE, active: true, passwordHash },
      create: { name: "Omar Khalil", email: "omar@helpdesklite.local", role: Role.EMPLOYEE, passwordHash },
    }),
    prisma.user.upsert({
      where: { email: "support@helpdesklite.local" },
      update: { name: "Sarah Nabil", role: Role.SUPPORT, active: true, passwordHash },
      create: { name: "Sarah Nabil", email: "support@helpdesklite.local", role: Role.SUPPORT, passwordHash },
    }),
    prisma.user.upsert({
      where: { email: "youssef@helpdesklite.local" },
      update: { name: "Youssef Adel", role: Role.SUPPORT, active: true, passwordHash },
      create: { name: "Youssef Adel", email: "youssef@helpdesklite.local", role: Role.SUPPORT, passwordHash },
    }),
    prisma.user.upsert({
      where: { email: "manager@helpdesklite.local" },
      update: { name: "Lina Farouk", role: Role.MANAGER, active: true, passwordHash },
      create: { name: "Lina Farouk", email: "manager@helpdesklite.local", role: Role.MANAGER, passwordHash },
    }),
  ]);

  const samples = [
    {
      key: "seed-laptop-dock",
      title: "Laptop dock stops detecting both monitors",
      description: "My USB-C dock disconnects both external monitors every few minutes. Reconnecting the cable restores them briefly.",
      category: TicketCategory.IT_HARDWARE,
      priority: TicketPriority.HIGH,
      status: TicketStatus.IN_PROGRESS,
      requesterId: employee.id,
      assigneeId: support.id,
    },
    {
      key: "seed-vpn-access",
      title: "VPN access needed for finance drive",
      description: "I can connect to the VPN, but the Finance shared drive says access denied. I need it for month-end files.",
      category: TicketCategory.ACCOUNT_ACCESS,
      priority: TicketPriority.URGENT,
      status: TicketStatus.OPEN,
      requesterId: employee.id,
      assigneeId: null,
    },
    {
      key: "seed-meeting-room",
      title: "Meeting room display has no signal",
      description: "The Nile meeting room display shows no signal with both the wall HDMI input and the wireless presenter.",
      category: TicketCategory.FACILITIES,
      priority: TicketPriority.MEDIUM,
      status: TicketStatus.WAITING,
      requesterId: secondEmployee.id,
      assigneeId: secondSupport.id,
    },
    {
      key: "seed-design-license",
      title: "Design application license expired",
      description: "The design tool reports that our team license has expired, so I cannot open the current campaign files.",
      category: TicketCategory.SOFTWARE,
      priority: TicketPriority.HIGH,
      status: TicketStatus.OPEN,
      requesterId: secondEmployee.id,
      assigneeId: null,
    },
    {
      key: "seed-wifi-guest",
      title: "Guest Wi-Fi disconnecting on fourth floor",
      description: "Visitors are being disconnected from the guest network near the fourth-floor training rooms.",
      category: TicketCategory.NETWORK,
      priority: TicketPriority.MEDIUM,
      status: TicketStatus.IN_PROGRESS,
      requesterId: employee.id,
      assigneeId: secondSupport.id,
    },
    {
      key: "seed-onboarding-form",
      title: "New starter form has an outdated department list",
      description: "The onboarding request form still lists the former Operations department name and is missing Customer Success.",
      category: TicketCategory.HR_PEOPLE,
      priority: TicketPriority.LOW,
      status: TicketStatus.RESOLVED,
      requesterId: employee.id,
      assigneeId: support.id,
    },
    {
      key: "seed-stale-shared-inbox",
      title: "Shared support inbox access still pending",
      description: "I requested access to the shared Operations inbox several days ago and still cannot open it. Support asked me to confirm the exact mailbox name.",
      category: TicketCategory.ACCOUNT_ACCESS,
      priority: TicketPriority.MEDIUM,
      status: TicketStatus.WAITING,
      requesterId: secondEmployee.id,
      assigneeId: support.id,
    },
  ];

  for (const sample of samples) {
    const exists = await prisma.ticket.findUnique({ where: { requestKey: sample.key } });
    if (exists) continue;

    const isStaleSample = sample.key === "seed-stale-shared-inbox";
    const createdAt = isStaleSample ? new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) : undefined;
    const updatedAt = isStaleSample ? new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) : undefined;

    await prisma.ticket.create({
      data: {
        requestKey: sample.key,
        title: sample.title,
        description: sample.description,
        category: sample.category,
        priority: sample.priority,
        status: sample.status,
        requesterId: sample.requesterId,
        assigneeId: sample.assigneeId,
        createdAt,
        updatedAt,
        resolvedAt: sample.status === TicketStatus.RESOLVED ? new Date() : null,
        activities: {
          create: {
            actorId: sample.requesterId,
            type: ActivityType.CREATED,
            content: "Request submitted",
            createdAt,
          },
        },
      },
    });
  }

  void manager;
  console.info("Seeded HelpDesk Lite demo data.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
