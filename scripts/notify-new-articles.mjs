import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";
import { getMessaging } from "firebase-admin/messaging";

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
const app = getApps().length
  ? getApps()[0]
  : initializeApp({
      credential: cert(serviceAccount),
      databaseURL:
        process.env.FIREBASE_DATABASE_URL ??
        "https://app-goma-webradio-default-rtdb.europe-west1.firebasedatabase.app",
    });

const database = getDatabase(app);
const messaging = getMessaging(app);
const postsUrl =
  "https://gomawebradio.com/wp-json/wp/v2/posts?per_page=20&orderby=date&order=desc&_embed=1&_fields=id,date,slug,title,link,_embedded";
const appUrl = process.env.APP_URL?.replace(/\/$/, "");

if (!appUrl) throw new Error("APP_URL secret is required");

function cleanTitle(value) {
  return value
    .replace(/&#8217;|&rsquo;|&#039;|&apos;/g, "'")
    .replace(/&#8216;|&lsquo;/g, "'")
    .replace(/&#8220;|&ldquo;|&#8221;|&rdquo;/g, '"')
    .replace(/&#8230;|&hellip;/g, "...")
    .replace(/&amp;/g, "&")
    .replace(/&#038;/g, "&")
    .replace(/<[^>]*>/g, "")
    .trim();
}

async function fetchPosts() {
  const response = await fetch(postsUrl, { headers: { accept: "application/json" } });
  if (!response.ok) throw new Error(`WordPress request failed [${response.status}]`);
  return response.json();
}

async function getTokens() {
  const snapshot = await database.ref("fcmTokens").once("value");
  const tokens = [];
  for (const value of Object.values(snapshot.val() ?? {})) {
    if (typeof value?.token === "string" && value.token.length > 0) tokens.push(value.token);
  }
  return [...new Set(tokens)];
}

const posts = (await fetchPosts())
  .filter((post) => post?.id && post?.date && post?.title?.rendered)
  .sort((a, b) => new Date(a.date) - new Date(b.date));
const stateRef = database.ref("notificationState/articles");
const state = (await stateRef.once("value")).val();
const latestPost = posts.at(-1);

if (!latestPost) {
  console.log("No WordPress articles found.");
  process.exit(0);
}

if (!state?.lastDate) {
  await stateRef.set({ lastId: latestPost.id, lastDate: latestPost.date });
  console.log(`Initialized at article ${latestPost.id}; no notification sent.`);
  process.exit(0);
}

const newPosts = posts.filter(
  (post) =>
    new Date(post.date).getTime() > new Date(state.lastDate).getTime() ||
    (post.date === state.lastDate && post.id !== state.lastId),
);
if (!newPosts.length) {
  console.log("No new articles.");
  process.exit(0);
}

const tokens = await getTokens();
if (!tokens.length) {
  console.log("No FCM tokens registered; state was not advanced.");
  process.exit(0);
}

for (const post of newPosts) {
  const title = cleanTitle(post.title.rendered);
  const image = post._embedded?.["wp:featuredmedia"]?.[0]?.source_url;
  const articleUrl = `${appUrl}/articles/${post.slug}`;
  const message = {
    tokens,
    notification: { title: "Nouvel article", body: title, imageUrl: image },
    data: { url: articleUrl, image: image ?? "" },
    webpush: {
      fcmOptions: { link: articleUrl },
      notification: { icon: `${appUrl}/logo.png`, badge: `${appUrl}/logo.png`, image },
    },
  };
  const result = await messaging.sendEachForMulticast(message);
  console.log(`Article ${post.id}: ${result.successCount} sent, ${result.failureCount} failed.`);
}

const lastPost = newPosts.at(-1);
await stateRef.set({ lastId: lastPost.id, lastDate: lastPost.date });
