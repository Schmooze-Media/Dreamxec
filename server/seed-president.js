const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding president...');

  let club = await prisma.club.findFirst({
    where: { name: 'Tech Innovators Club' }
  });

  if (!club) {
    club = await prisma.club.create({
      data: {
        name: 'Tech Innovators Club',
        slug: 'tech-innovators-club-' + Date.now(),
        description: 'A club for tech enthusiasts',
        college: 'Engineering Institute of Technology',
        presidentEmail: 'president@techinnovators.com'
      }
    });
    console.log('Created Club');
  }

  // Create President User
  const presidentUser = await prisma.user.upsert({
    where: { email: 'president@techinnovators.com' },
    update: {
      isClubPresident: true,
      clubVerified: true,
      studentVerified: true,
      clubs: { connect: { id: club.id } }
    },
    create: {
      email: 'president@techinnovators.com',
      name: 'Tech President',
      role: 'USER',
      isClubPresident: true,
      clubVerified: true,
      studentVerified: true,
      college: 'Engineering Institute of Technology',
      clubs: { connect: { id: club.id } }
    }
  });

  // Make sure the club references this user (if there's a relation)
  // Or just by linking `clubs: { connect: { id: club.id } }` they are part of the club.

  console.log('President User created:', presidentUser.email);

  // Assign one of the existing projects to the Club, so the president can approve transfers for it!
  const targetUserId = '6a01ab421d16e7e0eb5c7323';
  const updatedProjects = await prisma.userProject.updateMany({
    where: { userId: targetUserId },
    data: { clubId: club.id }
  });

  console.log(`Updated ${updatedProjects.count} projects to be under the Tech Innovators Club`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
