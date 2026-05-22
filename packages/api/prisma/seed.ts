import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const samplePosts = [
  { content: 'React Server Components are a game changer! #react #nextjs #webdev', hashtags: ['react','nextjs','webdev'], mediaUrls: ['https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=400&fit=crop'] },
  { content: 'Beautiful sunrise at the lake today 🌅 #photography #nature #landscape', hashtags: ['photography','nature','landscape'], mediaUrls: ['https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&h=400&fit=crop'] },
  { content: 'Tailwind CSS makes styling so much fun! #tailwind #css #frontend', hashtags: ['tailwind','css','frontend'], mediaUrls: ['https://images.unsplash.com/photo-1618477388954-7852f32655ec?w=800&h=400&fit=crop'] },
  { content: 'Exploring the old town streets 📸 #travel #architecture #urban', hashtags: ['travel','architecture','urban'], mediaUrls: ['https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&h=400&fit=crop'] },
  { content: 'GraphQL subscriptions are perfect for real-time features #graphql #realtime #websocket', hashtags: ['graphql','realtime','websocket'], mediaUrls: ['https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=400&fit=crop'] },
  { content: 'Autumn colors in the park 🍂 #autumn #nature #photography', hashtags: ['autumn','nature','photography'], mediaUrls: ['https://images.unsplash.com/photo-1507783548227-544c3b8fc065?w=800&h=400&fit=crop'] },
  { content: 'Docker compose makes local dev so smooth #docker #devops #development', hashtags: ['docker','devops','development'], mediaUrls: ['https://images.unsplash.com/photo-1605745341112-85968b19335b?w=800&h=400&fit=crop'] },
  { content: 'Night sky photography tips 🌌 #astrophotography #night #stars', hashtags: ['astrophotography','night','stars'], mediaUrls: ['https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=800&h=400&fit=crop'] },
  { content: 'Clean code is not about perfection, it is about clarity #cleancode #programming #software', hashtags: ['cleancode','programming','software'], mediaUrls: ['https://images.unsplash.com/photo-1551033406-611cf9a28f67?w=800&h=400&fit=crop'] },
  { content: 'Mountain hiking adventures ⛰️ #hiking #mountains #adventure', hashtags: ['hiking','mountains','adventure'], mediaUrls: ['https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&h=400&fit=crop'] },
  { content: 'TypeScript generics explained simply #typescript #javascript #tutorial', hashtags: ['typescript','javascript','tutorial'], mediaUrls: ['https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&h=400&fit=crop'] },
  { content: 'Street photography in the rain 🌧️ #streetphotography #rain #city', hashtags: ['streetphotography','rain','city'], mediaUrls: ['https://images.unsplash.com/photo-1498036882173-b41c28a8ba34?w=800&h=400&fit=crop'] },
  { content: 'Redis caching strategies for Node.js #redis #nodejs #caching', hashtags: ['redis','nodejs','caching'], mediaUrls: ['https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=400&fit=crop'] },
  { content: 'Sunset at the beach is magical 🌅 #sunset #beach #ocean', hashtags: ['sunset','beach','ocean'], mediaUrls: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=400&fit=crop'] },
  { content: 'Microservices architecture patterns #microservices #architecture #backend', hashtags: ['microservices','architecture','backend'], mediaUrls: ['https://images.unsplash.com/photo-1518432031352-d6fc5c10da5a?w=800&h=400&fit=crop'] },
  { content: 'Coffee and code - the perfect morning ☕ #coffee #coding #morning', hashtags: ['coffee','coding','morning'], mediaUrls: ['https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=400&fit=crop'] },
  { content: 'Neon lights of the city at night 🌃 #neon #city #nightphotography', hashtags: ['neon','city','nightphotography'], mediaUrls: ['https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&h=400&fit=crop'] },
  { content: 'Prisma ORM is amazing for TypeScript projects #prisma #orm #database', hashtags: ['prisma','orm','database'], mediaUrls: ['https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=400&fit=crop'] },
  { content: 'Autumn leaves and golden light 🍁 #autumn #goldenlight #nature', hashtags: ['autumn','goldenlight','nature'], mediaUrls: ['https://images.unsplash.com/photo-1477414348463-c0eb7f1359b6?w=800&h=400&fit=crop'] },
  { content: 'Web performance optimization tips #webperf #performance #webdev', hashtags: ['webperf','performance','webdev'], mediaUrls: ['https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop'] },
  { content: 'Foggy morning in the forest 🌲 #fog #forest #naturelovers', hashtags: ['fog','forest','naturelovers'], mediaUrls: ['https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=400&fit=crop'] },
  { content: 'Building a design system from scratch #designsystem #uidesign #components', hashtags: ['designsystem','uidesign','components'], mediaUrls: ['https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=400&fit=crop'] },
  { content: 'Urban exploration photography 🏙️ #urbanexploration #photography #cityscape', hashtags: ['urbanexploration','photography','cityscape'], mediaUrls: ['https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&h=400&fit=crop'] },
  { content: 'JWT authentication best practices #jwt #auth #security', hashtags: ['jwt','auth','security'], mediaUrls: ['https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=800&h=400&fit=crop'] },
  { content: 'Morning light through the window ☀️ #morninglight #interior #cozy', hashtags: ['morninglight','interior','cozy'], mediaUrls: ['https://images.unsplash.com/photo-1522156373667-4c7234bbd804?w=800&h=400&fit=crop'] },
  { content: 'CSS Grid vs Flexbox - when to use what #css #grid #flexbox', hashtags: ['css','grid','flexbox'], mediaUrls: ['https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?w=800&h=400&fit=crop'] },
  { content: 'Rainy day coding session 🌧️ #rainyday #coding #productivity', hashtags: ['rainyday','coding','productivity'], mediaUrls: ['https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&h=400&fit=crop'] },
  { content: 'Mountain lake reflection 🏔️ #lake #mountains #reflection', hashtags: ['lake','mountains','reflection'], mediaUrls: ['https://images.unsplash.com/photo-1439853949127-fa647821eba0?w=800&h=400&fit=crop'] },
  { content: 'Next.js App Router deep dive #nextjs #approuter #react', hashtags: ['nextjs','approuter','react'], mediaUrls: ['https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=400&fit=crop'] },
  { content: 'Desert landscape photography 🏜️ #desert #landscape #travel', hashtags: ['desert','landscape','travel'], mediaUrls: ['https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800&h=400&fit=crop'] },
  { content: 'PostgreSQL performance tuning #postgresql #database #performance', hashtags: ['postgresql','database','performance'], mediaUrls: ['https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=400&fit=crop'] },
  { content: 'Cherry blossoms in full bloom 🌸 #spring #cherryblossom #nature', hashtags: ['spring','cherryblossom','nature'], mediaUrls: ['https://images.unsplash.com/photo-1522383225653-ed111181a951?w=800&h=400&fit=crop'] },
  { content: 'API rate limiting strategies #api #ratelimit #backend', hashtags: ['api','ratelimit','backend'], mediaUrls: ['https://images.unsplash.com/photo-1518432031352-d6fc5c10da5a?w=800&h=400&fit=crop'] },
  { content: 'Northern lights in Iceland 🌌 #aurora #iceland #nature', hashtags: ['aurora','iceland','nature'], mediaUrls: ['https://images.unsplash.com/photo-1483347756197-71ef80e95f73?w=800&h=400&fit=crop'] },
  { content: 'Git workflow tips for teams #git #workflow #collaboration', hashtags: ['git','workflow','collaboration'], mediaUrls: ['https://images.unsplash.com/photo-1551033406-611cf9a28f67?w=800&h=400&fit=crop'] },
  { content: 'Ocean waves crashing on rocks 🌊 #ocean #waves #seascape', hashtags: ['ocean','waves','seascape'], mediaUrls: ['https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&h=400&fit=crop'] },
  { content: 'Monorepo setup with pnpm workspaces #monorepo #pnpm #tooling', hashtags: ['monorepo','pnpm','tooling'], mediaUrls: ['https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=400&fit=crop'] },
  { content: 'Stargazing in the desert ✨ #stars #desert #astronomy', hashtags: ['stars','desert','astronomy'], mediaUrls: ['https://images.unsplash.com/photo-1465101162946-4377e57745c3?w=800&h=400&fit=crop'] },
  { content: 'React hooks you should know #reacthooks #react #frontend', hashtags: ['reacthooks','react','frontend'], mediaUrls: ['https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=800&h=400&fit=crop'] },
  { content: 'Tropical paradise 🌴 #tropical #beach #paradise', hashtags: ['tropical','beach','paradise'], mediaUrls: ['https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800&h=400&fit=crop'] },
  { content: 'Web accessibility matters #a11y #accessibility #webdev', hashtags: ['a11y','accessibility','webdev'], mediaUrls: ['https://images.unsplash.com/photo-1551033406-611cf9a28f67?w=800&h=400&fit=crop'] },
  { content: 'City skyline at dusk 🌆 #skyline #city #dusk', hashtags: ['skyline','city','dusk'], mediaUrls: ['https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&h=400&fit=crop'] },
  { content: 'Testing React components with Vitest #testing #react #vitest', hashtags: ['testing','react','vitest'], mediaUrls: ['https://images.unsplash.com/photo-1551033406-611cf9a28f67?w=800&h=400&fit=crop'] },
  { content: 'Winter wonderland ❄️ #winter #snow #landscape', hashtags: ['winter','snow','landscape'], mediaUrls: ['https://images.unsplash.com/photo-1477601263568-180e2c6d046e?w=800&h=400&fit=crop'] },
  { content: 'Kubernetes for beginners #kubernetes #k8s #devops', hashtags: ['kubernetes','k8s','devops'], mediaUrls: ['https://images.unsplash.com/photo-1605745341112-85968b19335b?w=800&h=400&fit=crop'] },
  { content: 'Sunset over the mountains 🌄 #sunset #mountains #goldenhour', hashtags: ['sunset','mountains','goldenhour'], mediaUrls: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop'] },
  { content: 'Framer Motion animation recipes #framer #animation #react', hashtags: ['framer','animation','react'], mediaUrls: ['https://images.unsplash.com/photo-1551033406-611cf9a28f67?w=800&h=400&fit=crop'] },
  { content: 'Lavender fields in Provence 💜 #lavender #france #travel', hashtags: ['lavender','france','travel'], mediaUrls: ['https://images.unsplash.com/photo-1499002238440-d264edd596ec?w=800&h=400&fit=crop'] },
  { content: 'Error handling patterns in Node.js #nodejs #errorhandling #backend', hashtags: ['nodejs','errorhandling','backend'], mediaUrls: ['https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=400&fit=crop'] },
  { content: 'Autumn road trip 🍂 #roadtrip #autumn #travel', hashtags: ['roadtrip','autumn','travel'], mediaUrls: ['https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&h=400&fit=crop'] },
  { content: 'Database indexing explained #database #sql #performance', hashtags: ['database','sql','performance'], mediaUrls: ['https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=400&fit=crop'] },
  { content: 'Crystal clear waters 🏝️ #water #beach #clear', hashtags: ['water','beach','clear'], mediaUrls: ['https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=800&h=400&fit=crop'] },
  { content: 'CI/CD pipeline with GitHub Actions #cicd #githubactions #devops', hashtags: ['cicd','githubactions','devops'], mediaUrls: ['https://images.unsplash.com/photo-1605745341112-85968b19335b?w=800&h=400&fit=crop'] },
  { content: 'Wildflowers in the meadow 🌼 #wildflowers #meadow #spring', hashtags: ['wildflowers','meadow','spring'], mediaUrls: ['https://images.unsplash.com/photo-1444021465936-c6ca52d8b1cd?w=800&h=400&fit=crop'] },
  { content: 'Zustand vs Redux for state management #zustand #redux #react', hashtags: ['zustand','redux','react'], mediaUrls: ['https://images.unsplash.com/photo-1551033406-611cf9a28f67?w=800&h=400&fit=crop'] },
  { content: 'Coastal hiking trail 🌊 #hiking #coastal #trail', hashtags: ['hiking','coastal','trail'], mediaUrls: ['https://images.unsplash.com/photo-1440595841495-ef666d251239?w=800&h=400&fit=crop'] },
  { content: 'REST vs GraphQL - pros and cons #rest #graphql #api', hashtags: ['rest','graphql','api'], mediaUrls: ['https://images.unsplash.com/photo-1518432031352-d6fc5c10da5a?w=800&h=400&fit=crop'] },
  { content: 'Milky Way over the valley 🌌 #milkyway #night #stars', hashtags: ['milkyway','night','stars'], mediaUrls: ['https://images.unsplash.com/photo-1502481851512-e9e2529bfbf9?w=800&h=400&fit=crop'] },
  { content: 'Working from a cozy cabin 🏡 #cabin #remote #cozy', hashtags: ['cabin','remote','cozy'], mediaUrls: ['https://images.unsplash.com/photo-1482192505345-5655af888cc4?w=800&h=400&fit=crop'] },
  { content: 'TypeScript utility types cheat sheet #typescript #utilities #cheatsheet', hashtags: ['typescript','utilities','cheatsheet'], mediaUrls: ['https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&h=400&fit=crop'] },
  { content: 'Waterfall in the jungle 🌿 #waterfall #jungle #nature', hashtags: ['waterfall','jungle','nature'], mediaUrls: ['https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=800&h=400&fit=crop'] },
  { content: 'Docker networking explained #docker #networking #devops', hashtags: ['docker','networking','devops'], mediaUrls: ['https://images.unsplash.com/photo-1605745341112-85968b19335b?w=800&h=400&fit=crop'] },
  { content: 'Snowy mountain peaks 🏔️ #snow #mountains #winter', hashtags: ['snow','mountains','winter'], mediaUrls: ['https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=800&h=400&fit=crop'] },
  { content: 'Apollo Client cache strategies #apollo #graphql #cache', hashtags: ['apollo','graphql','cache'], mediaUrls: ['https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=400&fit=crop'] },
  { content: 'Vintage car photography 🚗 #vintage #car #photography', hashtags: ['vintage','car','photography'], mediaUrls: ['https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&h=400&fit=crop'] },
  { content: 'Code review best practices #codereview #programming #team', hashtags: ['codereview','programming','team'], mediaUrls: ['https://images.unsplash.com/photo-1551033406-611cf9a28f67?w=800&h=400&fit=crop'] },
  { content: 'Sunset sailing ⛵ #sailing #sunset #ocean', hashtags: ['sailing','sunset','ocean'], mediaUrls: ['https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=800&h=400&fit=crop'] },
  { content: 'Prisma migrations guide #prisma #migrations #database', hashtags: ['prisma','migrations','database'], mediaUrls: ['https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=400&fit=crop'] },
  { content: 'Colorful hot air balloons 🎈 #balloons #sky #colorful', hashtags: ['balloons','sky','colorful'], mediaUrls: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop'] },
  { content: 'React performance optimization #react #performance #optimization', hashtags: ['react','performance','optimization'], mediaUrls: ['https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=400&fit=crop'] },
  { content: 'Ancient ruins at sunset 🏛️ #ruins #history #sunset', hashtags: ['ruins','history','sunset'], mediaUrls: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=400&fit=crop'] },
  { content: 'WebSocket vs SSE for real-time #websocket #sse #realtime', hashtags: ['websocket','sse','realtime'], mediaUrls: ['https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=400&fit=crop'] },
  { content: 'Rainbow after the storm 🌈 #rainbow #storm #sky', hashtags: ['rainbow','storm','sky'], mediaUrls: ['https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&h=400&fit=crop'] },
  { content: 'Clean architecture in Node.js #cleanarchitecture #nodejs #backend', hashtags: ['cleanarchitecture','nodejs','backend'], mediaUrls: ['https://images.unsplash.com/photo-1518432031352-d6fc5c10da5a?w=800&h=400&fit=crop'] },
  { content: 'Autumn forest path 🍁 #forest #autumn #path', hashtags: ['forest','autumn','path'], mediaUrls: ['https://images.unsplash.com/photo-1507041957456-9c397ce39c97?w=800&h=400&fit=crop'] },
  { content: 'Tailwind CSS dark mode tips #tailwind #darkmode #css', hashtags: ['tailwind','darkmode','css'], mediaUrls: ['https://images.unsplash.com/photo-1618477388954-7852f32655ec?w=800&h=400&fit=crop'] },
  { content: 'Starry night in the mountains ⭐ #stars #mountains #night', hashtags: ['stars','mountains','night'], mediaUrls: ['https://images.unsplash.com/photo-1465101162946-4377e57745c3?w=800&h=400&fit=crop'] },
  { content: 'NestJS for enterprise applications #nestjs #nodejs #enterprise', hashtags: ['nestjs','nodejs','enterprise'], mediaUrls: ['https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=400&fit=crop'] },
  { content: 'Desert oasis 🌴 #desert #oasis #nature', hashtags: ['desert','oasis','nature'], mediaUrls: ['https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800&h=400&fit=crop'] },
  { content: 'GitHub Copilot tips and tricks #github #copilot #ai', hashtags: ['github','copilot','ai'], mediaUrls: ['https://images.unsplash.com/photo-1551033406-611cf9a28f67?w=800&h=400&fit=crop'] },
];

async function main() {
  console.log('🌱 Seeding 80 additional posts...');

  const passwordHash = await bcrypt.hash('password123', 10);

  // Ensure users exist
  const users = await Promise.all([
    prisma.user.upsert({ where: { email: 'john@example.com' }, update: {}, create: { username: 'john_doe', email: 'john@example.com', passwordHash, displayName: 'John Doe', bio: 'Full-stack developer & coffee enthusiast.', avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face' } }),
    prisma.user.upsert({ where: { email: 'jane@example.com' }, update: {}, create: { username: 'jane_smith', email: 'jane@example.com', passwordHash, displayName: 'Jane Smith', bio: 'Digital artist & photographer.', avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face' } }),
    prisma.user.upsert({ where: { email: 'tech@example.com' }, update: {}, create: { username: 'tech_guru', email: 'tech@example.com', passwordHash, displayName: 'Tech Guru', bio: 'Tech reviewer & gadget lover.', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face' } }),
    prisma.user.upsert({ where: { email: 'sarah@example.com' }, update: {}, create: { username: 'sarah_codes', email: 'sarah@example.com', passwordHash, displayName: 'Sarah Codes', bio: 'Frontend engineer passionate about React.', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face' } }),
    prisma.user.upsert({ where: { email: 'mike@example.com' }, update: {}, create: { username: 'mike_designs', email: 'mike@example.com', passwordHash, displayName: 'Mike Designs', bio: 'UI/UX designer.', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face' } }),
  ]);

  // Make John follow everyone
  const john = users[0];
  for (const user of users) {
    if (user.id !== john.id) {
      await prisma.follow.upsert({
        where: { followerId_followingId: { followerId: john.id, followingId: user.id } },
        update: {},
        create: { followerId: john.id, followingId: user.id },
      });
    }
  }

  // Create 80 posts distributed among users
  let createdCount = 0;
  for (let i = 0; i < 80; i++) {
    const postTemplate = samplePosts[i % samplePosts.length];
    const author = users[i % users.length];
    
    await prisma.post.create({
      data: {
        content: postTemplate.content,
        hashtags: postTemplate.hashtags,
        mediaUrls: postTemplate.mediaUrls,
        authorId: author.id,
        likeCount: Math.floor(Math.random() * 150) + 5,
        commentCount: Math.floor(Math.random() * 30) + 1,
      },
    });
    createdCount++;
  }

  // Update hashtag counts
  const allTags = new Set(samplePosts.flatMap(p => p.hashtags));
  for (const tag of allTags) {
    const count = await prisma.post.count({ where: { hashtags: { has: tag } } });
    await prisma.hashtag.upsert({
      where: { name: tag },
      update: { postCount: count },
      create: { name: tag, postCount: count },
    });
  }

  console.log(`✅ Added ${createdCount} new posts!`);
  console.log(`👤 John follows ${users.length - 1} users`);
  console.log(`🏷️ ${allTags.size} hashtags updated`);
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
