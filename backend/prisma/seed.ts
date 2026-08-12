// Seeds one real demo account so the app isn't an empty shell on first run.
// Login with demo@globetrotter.app / globetrotter-demo after seeding.
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await argon2.hash('globetrotter-demo');

  const user = await prisma.user.upsert({
    where: { email: 'demo@globetrotter.app' },
    update: {},
    create: {
      email: 'demo@globetrotter.app',
      passwordHash,
      name: 'Alex Reyes',
      travelStyle: 'comfort',
      homeCurrency: 'USD',
    },
  });

  const friend = await prisma.user.upsert({
    where: { email: 'jordan@globetrotter.app' },
    update: {},
    create: {
      email: 'jordan@globetrotter.app',
      passwordHash: await argon2.hash('globetrotter-demo'),
      name: 'Jordan Blake',
      travelStyle: 'comfort',
    },
  });

  const existing = await prisma.trip.findFirst({ where: { ownerId: user.id, name: 'Kyoto in Autumn' } });
  const trip =
    existing ??
    (await prisma.trip.create({
      data: {
        ownerId: user.id,
        name: 'Kyoto in Autumn',
        subtitle: 'Temple hopping & kaiseki nights',
        coverPhotoUrl:
          'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200&q=80',
        originCode: 'SFO',
        destinationCode: 'KIX',
        startDate: new Date('2026-11-04'),
        endDate: new Date('2026-11-12'),
        budgetPlanned: 4200,
        status: 'upcoming',
        collaborators: { create: { userId: friend.id, role: 'editor' } },
        stops: {
          create: [
            { dayIndex: 0, orderIndex: 0, name: 'JL 001 · SFO → KIX', category: 'flight', city: 'SFO', country: 'USA', cost: 1180, booked: true, startTime: new Date('2026-11-04T11:40:00Z') },
            { dayIndex: 0, orderIndex: 1, name: 'Hotel Kanra Kyoto', category: 'stay', city: 'Kyoto', country: 'Japan', cost: 640, booked: true, startTime: new Date('2026-11-04T19:20:00Z') },
            { dayIndex: 1, orderIndex: 0, name: "Kiyomizu-dera at dawn", category: 'see', city: 'Kyoto', country: 'Japan', cost: 5, notes: 'Enter before the tour buses arrive.', startTime: new Date('2026-11-05T06:15:00Z') },
            { dayIndex: 1, orderIndex: 1, name: 'Breakfast · Inoda Coffee', category: 'eat', city: 'Kyoto', country: 'Japan', cost: 18, startTime: new Date('2026-11-05T08:30:00Z') },
            { dayIndex: 1, orderIndex: 2, name: "Philosopher's Path walk", category: 'move', city: 'Kyoto', country: 'Japan', cost: 0, startTime: new Date('2026-11-05T10:00:00Z') },
            { dayIndex: 1, orderIndex: 3, name: 'Kaiseki · Kikunoi Roan', category: 'eat', city: 'Kyoto', country: 'Japan', cost: 240, booked: true, startTime: new Date('2026-11-05T19:30:00Z') },
            { dayIndex: 2, orderIndex: 0, name: 'Bamboo grove', category: 'see', city: 'Kyoto', country: 'Japan', cost: 0, startTime: new Date('2026-11-06T07:00:00Z') },
            { dayIndex: 2, orderIndex: 1, name: 'Tenryu-ji garden', category: 'see', city: 'Kyoto', country: 'Japan', cost: 8, startTime: new Date('2026-11-06T09:00:00Z') },
          ],
        },
      },
      include: { stops: true },
    }));

  const stops = 'stops' in trip ? trip.stops : await prisma.stop.findMany({ where: { tripId: trip.id } });
  const firstSeeStop = stops.find((s) => s.category === 'see');
  if (firstSeeStop) {
    const already = await prisma.comment.findFirst({ where: { stopId: firstSeeStop.id } });
    if (!already) {
      await prisma.comment.create({
        data: { stopId: firstSeeStop.id, userId: friend.id, body: 'Can we push this to 6am? Sunrise light is worth losing the sleep.' },
      });
    }
  }

  console.log('Seeded demo account: demo@globetrotter.app / globetrotter-demo');
  console.log(`Seeded trip: ${trip.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
