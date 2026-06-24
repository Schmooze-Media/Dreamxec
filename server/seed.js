const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding data...');

  // Create a mock club
  const club = await prisma.club.create({
    data: {
      name: 'Tech Innovators Club',
      slug: 'tech-innovators-club-' + Date.now(),
      description: 'A club for tech enthusiasts',
      college: 'Engineering Institute of Technology',
      verified: true,
      presidentEmail: 'president@techinnovators.com'
    }
  });

  console.log('Created Club:', club.name);

  // Create Users
  const usersToCreate = [
    {
      name: 'Alice Smith',
      email: 'alice.smith@example.com',
      clerkId: 'user_alice123',
      role: 'STUDENT',
      studentVerified: true,
      college: 'Engineering Institute of Technology',
      points: 150
    },
    {
      name: 'Bob Jones',
      email: 'bob.jones@example.com',
      clerkId: 'user_bob123',
      role: 'STUDENT',
      studentVerified: true,
      college: 'Engineering Institute of Technology',
      points: 200
    },
    {
      name: 'Charlie Brown',
      email: 'charlie.brown@example.com',
      clerkId: 'user_charlie123',
      role: 'STUDENT',
      studentVerified: true,
      college: 'National Science University',
      points: 50
    }
  ];

  const createdUsers = [];
  for (const userData of usersToCreate) {
    const user = await prisma.user.create({ data: userData });
    createdUsers.push(user);
    console.log('Created User:', user.email);
  }

  // Create Projects
  const projectsToCreate = [
    {
      title: 'Solar Powered Backpack',
      slug: 'solar-powered-backpack-' + Date.now(),
      description: 'A backpack with integrated solar panels to charge devices on the go.',
      goalAmount: 15000,
      currentAmount: 3000,
      status: 'APPROVED',
      campaignType: 'INDIVIDUAL',
      userId: createdUsers[0].id,
      clubId: club.id
    },
    {
      title: 'Community Garden Sensors',
      slug: 'community-garden-sensors-' + Date.now(),
      description: 'IoT sensors to monitor soil moisture in local community gardens.',
      goalAmount: 25000,
      currentAmount: 12000,
      status: 'APPROVED',
      campaignType: 'TEAM',
      userId: createdUsers[0].id,
      clubId: club.id
    },
    {
      title: 'Eco-Friendly Packaging Material',
      slug: 'eco-friendly-packaging-' + Date.now(),
      description: 'Developing a new biodegradable packaging material from agricultural waste.',
      goalAmount: 40000,
      currentAmount: 40000,
      status: 'APPROVED',
      campaignType: 'TEAM',
      userId: createdUsers[1].id,
      clubId: club.id
    },
    {
      title: 'Student Mental Health App',
      slug: 'student-mental-health-app-' + Date.now(),
      description: 'An anonymous platform for students to seek peer support and mental health resources.',
      goalAmount: 50000,
      currentAmount: 5000,
      status: 'APPROVED',
      campaignType: 'INDIVIDUAL',
      userId: createdUsers[2].id
    }
  ];

  for (const projData of projectsToCreate) {
    const project = await prisma.userProject.create({
      data: {
        ...projData,
        milestones: {
          create: [
            { title: 'Research & Design', durationDays: 14, budget: projData.goalAmount * 0.3, order: 1 },
            { title: 'Prototyping', durationDays: 30, budget: projData.goalAmount * 0.4, order: 2 },
            { title: 'Final Testing', durationDays: 14, budget: projData.goalAmount * 0.3, order: 3 }
          ]
        }
      }
    });
    console.log('Created Project:', project.title);
  }

  console.log('Seeding completed successfully!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
