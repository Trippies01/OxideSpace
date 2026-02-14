// Supabase Edge Function - LiveKit Token Generator
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
function base64UrlEncode(data: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...data));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function signJwtHS256(secret: string, payload: Record<string, unknown>) {
  const encoder = new TextEncoder();
  const header = { alg: "HS256", typ: "JWT" };
  const headerBytes = encoder.encode(JSON.stringify(header));
  const payloadBytes = encoder.encode(JSON.stringify(payload));

  const signingInput = `${base64UrlEncode(headerBytes)}.${base64UrlEncode(payloadBytes)}`;
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(signingInput));
  const signatureBytes = new Uint8Array(signature);
  return `${signingInput}.${base64UrlEncode(signatureBytes)}`;
}

const LIVEKIT_URL = Deno.env.get("LIVEKIT_URL") || "";
const LIVEKIT_API_KEY = Deno.env.get("LIVEKIT_API_KEY") || "";
const LIVEKIT_API_SECRET = Deno.env.get("LIVEKIT_API_SECRET") || "";

interface RequestBody {
  userId: string;
  roomName: string;
  userName?: string;
}

serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Validate environment variables
    if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
      console.error("LiveKit API credentials are not set");
      return new Response(
        JSON.stringify({ 
          error: "LiveKit API key/secret is missing. Please check environment variables." 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        },
      );
    }

    // Parse request body
    let parsedBody: RequestBody;
    try {
      parsedBody = await req.json();
    } catch (error) {
      return new Response(
        JSON.stringify({ 
          error: "Invalid JSON body", 
          details: error instanceof Error ? error.message : String(error) 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        },
      );
    }

    const { userId, roomName, userName } = parsedBody;

    // Validate required fields
    if (!userId || !roomName) {
      return new Response(
        JSON.stringify({ 
          error: "Missing required fields: userId and roomName are required" 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        },
      );
    }

    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: LIVEKIT_API_KEY,
      sub: userId,
      name: userName || userId,
      nbf: now - 5,
      iat: now,
      exp: now + 60 * 60 * 6,
      video: {
        room: roomName,
        roomJoin: true,
        canPublish: true,
        canSubscribe: true,
        canPublishData: true,
      },
    };

    if (!crypto?.subtle) {
      return new Response(
        JSON.stringify({ 
          error: "Crypto API is not available in this runtime." 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        },
      );
    }

    const token = await signJwtHS256(LIVEKIT_API_SECRET, payload);

    // Return token
    return new Response(
      JSON.stringify({ 
        token,
        url: LIVEKIT_URL || null,
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      },
    );
  } catch (error) {
    console.error("Error generating LiveKit token:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error occurred" 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      },
    );
  }
});



