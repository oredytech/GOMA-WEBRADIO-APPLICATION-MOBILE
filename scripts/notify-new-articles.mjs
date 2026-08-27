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
const postsEndpoint = "https://gomawebradio.com/wp-json/wp/v2/posts";
const appUrl = process.env.APP_URL?.replace(/\/$/, "");
const requestedArticleId = process.env.ARTICLE_ID?.trim();
const requestedArticleIds = (() => {
  try {
    const value = JSON.parse(process.env.ARTICLE_IDS ?? "[]");
    return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
  } catch {
    return [];
  }
})();
const invalidTokenCodes = new Set([
  "messaging/invalid-registration-token",
  "messaging/registration-token-not-registered",
]);
const retryDelayMs = 10 * 1000;

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
  if (requestedArticleIds.length > 0) {
    return Promise.all(
      requestedArticleIds.map(async (id) => {
        const response = await fetch(`${postsEndpoint}/${encodeURIComponent(id)}?_embed=1`, {
          headers: { accept: "application/json" },
          signal: AbortSignal.timeout(15_000),
        });
        if (!response.ok)
          throw new Error(`WordPress request failed [${response.status}] for ${id}`);
        return response.json();
      }),
    );
  }
  const postsUrl = requestedArticleId
    ? `${postsEndpoint}/${encodeURIComponent(requestedArticleId)}?_embed=1`
    : `${postsEndpoint}?per_page=20&orderby=date&order=desc&_embed=1`;
  const response = await fetch(postsUrl, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`WordPress request failed [${response.status}]`);
  const payload = await response.json();
  return Array.isArray(payload) ? payload : [payload];
}

async function getTokens() {
  const snapshot = await database.ref("fcmTokens").once("value");
  const tokens = [];
  for (const [key, value] of Object.entries(snapshot.val() ?? {})) {
    if (typeof value?.token === "string" && value.token.length > 0) {
      tokens.push({ key, token: value.token });
    }
  }
  return [...new Map(tokens.map((entry) => [entry.token, entry])).values()];
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

if (!state?.lastId && !requestedArticleId && !requestedArticleIds.length) {
  await stateRef.set({ lastId: latestPost.id, lastDate: latestPost.date });
  console.log(`Initialized at article ${latestPost.id}; no notification sent.`);
  process.exit(0);
}

const lastId = state?.lastId ? Number(state.lastId) : Number(latestPost.id) - 1;
const newPosts = requestedArticleIds.length
  ? posts.sort((a, b) => a.id - b.id)
  : posts.filter((post) => Number(post.id) > lastId).sort((a, b) => a.id - b.id);
if (!newPosts.length) {
  console.log("No new articles.");
  process.exit(0);
}

const tokens = await getTokens();
if (!tokens.length) {
  const lastPost = newPosts.at(-1);
  await stateRef.set({ lastId: lastPost.id, lastDate: lastPost.date });
  console.log("No FCM tokens registered; state advanced without sending.");
  process.exit(0);
}

for (const post of newPosts) {
  const title = cleanTitle(post.title.rendered);
  const image =
    post._embedded?.["wp:featuredmedia"]?.[0]?.source_url ??
    post._embedded?.["wp:featuredmedia"]?.[0]?.media_details?.sizes?.full?.source_url;
  const articleUrl = `${appUrl}/articles/${post.slug}`;
  const message = {
    tokens: tokens.map((entry) => entry.token),
    notification: { title: "Nouvel article", body: title, ...(image ? { imageUrl: image } : {}) },
    data: { url: articleUrl, image: image ?? "" },
    webpush: {
      fcmOptions: { link: articleUrl },
      notification: {
        icon: `${appUrl}/logo.png`,
        badge: `${appUrl}/notification-badge.png`,
        ...(image ? { image } : {}),
      },
    },
  };
  const result = await messaging.sendEachForMulticast(message);
  console.log(`Article ${post.id}: ${result.successCount} sent, ${result.failureCount} failed.`);

  const invalidTokenKeys = result.responses
    .map((response, index) =>
      !response.success && invalidTokenCodes.has(response.error?.code) ? tokens[index].key : null,
    )
    .filter(Boolean);
  await Promise.all(invalidTokenKeys.map((key) => database.ref(`fcmTokens/${key}`).remove()));

  const retryTokens = tokens.filter(
    (entry, index) =>
      !result.responses[index].success &&
      !invalidTokenCodes.has(result.responses[index].error?.code),
  );
  if (retryTokens.length) {
    console.log(
      `Retrying ${retryTokens.length} failed notification(s) for article ${post.id} in 10 seconds.`,
    );
    await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
    const retryResult = await messaging.sendEachForMulticast({
      ...message,
      tokens: retryTokens.map((entry) => entry.token),
    });
    console.log(
      `Article ${post.id} retry: ${retryResult.successCount} sent, ${retryResult.failureCount} failed.`,
    );

    const retryInvalidTokenKeys = retryResult.responses
      .map((response, index) =>
        !response.success && invalidTokenCodes.has(response.error?.code)
          ? retryTokens[index].key
          : null,
      )
      .filter(Boolean);
    await Promise.all(
      retryInvalidTokenKeys.map((key) => database.ref(`fcmTokens/${key}`).remove()),
    );
    if (retryResult.failureCount > retryInvalidTokenKeys.length) {
      throw new Error(`Notification retry failed for article ${post.id}.`);
    }
  }
}

const lastPost = newPosts.at(-1);
await stateRef.set({ lastId: lastPost.id, lastDate: lastPost.date });
