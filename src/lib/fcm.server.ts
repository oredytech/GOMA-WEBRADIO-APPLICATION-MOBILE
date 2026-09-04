/**
 * FCM HTTP v1 sender for the Cloudflare Worker runtime.
 * No firebase-admin: the service-account JWT is signed with Web Crypto (RS256)
 * and device tokens are read from the Realtime Database REST API.
 */

type ServiceAccount = {
  client_email: string;
  private_key: string;
  project_id: string;
  token_uri?: string;
};

export type FcmMessage = {
  title: string;
  body: string;
  url?: string;
  image?: string;
  data?: Record<string, string>;
};

export type FcmSendResult = {
  sent: number;
  failed: number;
  removed: number;
  errors: string[];
};

const INVALID_TOKEN_ERRORS = new Set(["UNREGISTERED", "INVALID_ARGUMENT"]);

function readServiceAccount(): ServiceAccount {
  const raw = process.env["FIREBASE_SERVICE_ACCOUNT_JSON"];
  if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not configured");
  const parsed = JSON.parse(raw) as ServiceAccount;
  if (!parsed.client_email || !parsed.private_key || !parsed.project_id) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is missing required fields");
  }
  return parsed;
}

function base64Url(input: ArrayBuffer | string): string {
  const bytes =
    typeof input === "string" ? new TextEncoder().encode(input) : new Uint8Array(input);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const body = pem
    .replace(/\\n/g, "\n")
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");
  const binary = atob(body);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

let cachedToken: { value: string; expiresAt: number } | undefined;

async function getAccessToken(account: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.expiresAt - 60 > now) return cachedToken.value;

  const tokenUri = account.token_uri ?? "https://oauth2.googleapis.com/token";
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64Url(
    JSON.stringify({
      iss: account.client_email,
      scope: [
        "https://www.googleapis.com/auth/firebase.messaging",
        "https://www.googleapis.com/auth/firebase.database",
        "https://www.googleapis.com/auth/userinfo.email",
      ].join(" "),
      aud: tokenUri,
      iat: now,
      exp: now + 3600,
    }),
  );
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(account.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(`${header}.${claims}`),
  );
  const assertion = `${header}.${claims}.${base64Url(signature)}`;

  const res = await fetch(tokenUri, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  const payload = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!res.ok || !payload.access_token) {
    throw new Error(`Google token request failed [${res.status}]: ${JSON.stringify(payload)}`);
  }
  cachedToken = {
    value: payload.access_token,
    expiresAt: now + (payload.expires_in ?? 3600),
  };
  return cachedToken.value;
}

function databaseUrl(): string {
  return (
    process.env["FIREBASE_DATABASE_URL"] ??
    "https://app-goma-webradio-default-rtdb.europe-west1.firebasedatabase.app"
  ).replace(/\/$/, "");
}

/** Device tokens registered by the app, keyed by their RTDB node id. */
export async function listDeviceTokens(
  accessToken: string,
): Promise<Array<{ key: string; token: string }>> {
  const res = await fetch(`${databaseUrl()}/fcmTokens.json?access_token=${accessToken}`);
  if (!res.ok) throw new Error(`Realtime Database read failed [${res.status}]: ${await res.text()}`);
  const payload = (await res.json()) as Record<string, { token?: string }> | null;
  const entries = Object.entries(payload ?? {})
    .filter(([, value]) => typeof value?.token === "string" && value.token.length > 0)
    .map(([key, value]) => ({ key, token: value.token as string }));
  return [...new Map(entries.map((entry) => [entry.token, entry])).values()];
}

async function removeDeviceToken(accessToken: string, key: string): Promise<void> {
  await fetch(`${databaseUrl()}/fcmTokens/${encodeURIComponent(key)}.json?access_token=${accessToken}`, {
    method: "DELETE",
  });
}

export async function sendNotification(message: FcmMessage): Promise<FcmSendResult> {
  const account = readServiceAccount();
  const accessToken = await getAccessToken(account);
  const devices = await listDeviceTokens(accessToken);
  const result: FcmSendResult = { sent: 0, failed: 0, removed: 0, errors: [] };
  if (devices.length === 0) return result;

  const endpoint = `https://fcm.googleapis.com/v1/projects/${account.project_id}/messages:send`;
  const link = message.url ?? "/notifications";

  for (const device of devices) {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        message: {
          token: device.token,
          notification: {
            title: message.title,
            body: message.body,
            ...(message.image ? { image: message.image } : {}),
          },
          data: {
            url: link,
            title: message.title,
            image: message.image ?? "",
            ...(message.data ?? {}),
          },
          webpush: {
            fcmOptions: { link },
            notification: {
              icon: "/logo.png",
              badge: "/notification-badge.png",
              ...(message.image ? { image: message.image } : {}),
            },
          },
        },
      }),
    });

    if (res.ok) {
      result.sent += 1;
      continue;
    }

    const errorBody = await res.text();
    result.failed += 1;
    result.errors.push(`[${res.status}] ${errorBody}`);
    console.error(`FCM send failed [${res.status}]: ${errorBody}`);

    let status = "";
    try {
      status = String((JSON.parse(errorBody) as { error?: { status?: string } }).error?.status ?? "");
    } catch {
      /* ignore */
    }
    if (INVALID_TOKEN_ERRORS.has(status) || res.status === 404) {
      await removeDeviceToken(accessToken, device.key);
      result.removed += 1;
    }
  }

  return result;
}
