import bcrypt from 'bcryptjs';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { Event } from '../src/models/Event.js';
import { USER_ROLES, EVENT_STATUS, EVENT_MODE } from '../src/utils/constants.js';

function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

async function seed() {
  await connectDB();

  console.log('[seed] Clearing existing Users and Events...');
  await Promise.all([User.deleteMany({}), Event.deleteMany({})]);

  const passwordHash = await bcrypt.hash('password123', 10);

  const [organizer1, organizer2] = await User.create([
    { name: 'Amara Chen', email: 'organizer1@nexevent.dev', passwordHash, role: USER_ROLES.ORGANIZER },
    { name: 'Devon Okafor', email: 'organizer2@nexevent.dev', passwordHash, role: USER_ROLES.ORGANIZER },
    { name: 'Priya Nair', email: 'participant1@nexevent.dev', passwordHash, role: USER_ROLES.PARTICIPANT },
    { name: 'Sam Rivera', email: 'participant2@nexevent.dev', passwordHash, role: USER_ROLES.PARTICIPANT },
  ]);

  await Event.create([
    {
      name: 'React Summit Meetup',
      description: 'An evening of talks on modern React patterns and performance.',
      category: 'Technology',
      date: daysFromNow(7),
      startTime: '18:00',
      endTime: '21:00',
      mode: EVENT_MODE.ONSITE,
      location: { address: 'WeWork, Bandra Kurla Complex, Mumbai', latitude: 19.0662, longitude: 72.8681 },
      organizer: organizer1._id,
      capacity: 60,
      status: EVENT_STATUS.PUBLISHED,
    },
    {
      name: 'Startup Pitch Night',
      description: 'Early-stage founders pitch to a panel of investors. Small room — seats fill fast.',
      category: 'Business',
      date: daysFromNow(3),
      startTime: '17:00',
      endTime: '20:00',
      mode: EVENT_MODE.ONSITE,
      location: { address: 'T-Hub, Hyderabad', latitude: 17.4474, longitude: 78.3762 },
      organizer: organizer1._id,
      capacity: 5,
      status: EVENT_STATUS.PUBLISHED,
    },
    {
      name: 'Intro to MongoDB Aggregations',
      description: 'A hands-on online workshop covering the aggregation pipeline.',
      category: 'Education',
      date: daysFromNow(10),
      startTime: '10:00',
      endTime: '12:00',
      mode: EVENT_MODE.ONLINE,
      location: {},
      organizer: organizer2._id,
      capacity: 100,
      status: EVENT_STATUS.PUBLISHED,
    },
    {
      name: 'City Marathon Volunteer Briefing',
      description: 'Mandatory briefing for all marathon-day volunteers.',
      category: 'Sports',
      date: daysFromNow(-2),
      startTime: '09:00',
      endTime: '10:30',
      mode: EVENT_MODE.ONSITE,
      location: { address: 'Marine Drive, Mumbai', latitude: 18.9432, longitude: 72.8235 },
      organizer: organizer2._id,
      capacity: 40,
      status: EVENT_STATUS.PUBLISHED,
    },
    {
      name: 'Design Systems Roundtable',
      description: 'Draft — not yet published, should never appear on the public Explore page.',
      category: 'Arts',
      date: daysFromNow(14),
      startTime: '15:00',
      endTime: '17:00',
      mode: EVENT_MODE.ONSITE,
      location: { address: 'Indiranagar, Bengaluru', latitude: 12.9716, longitude: 77.6412 },
      organizer: organizer1._id,
      capacity: 30,
      status: EVENT_STATUS.DRAFT,
    },
    {
      name: 'Old Jazz Night',
      description: 'Cancelled due to venue unavailability.',
      category: 'Music',
      date: daysFromNow(5),
      startTime: '19:00',
      endTime: '22:00',
      mode: EVENT_MODE.ONSITE,
      location: { address: 'Blue Frog, Mumbai', latitude: 19.0176, longitude: 72.8562 },
      organizer: organizer2._id,
      capacity: 50,
      status: EVENT_STATUS.CANCELLED,
    },
  ]);

  console.log(`[seed] Created ${await User.countDocuments()} users and ${await Event.countDocuments()} events.`);
  console.log('[seed] Organizer login: organizer1@nexevent.dev / password123');
  console.log('[seed] Participant login: participant1@nexevent.dev / password123');

  await disconnectDB();
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[seed] Failed:', err);
    process.exit(1);
  });
