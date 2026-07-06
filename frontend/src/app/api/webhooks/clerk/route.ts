import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.SVIX_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error("Please add SVIX_WEBHOOK_SECRET from Clerk Dashboard to .env");
    return new Response("Error occurred -- missing webhook secret", { status: 400 });
  }

  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error occurred -- no svix headers", {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error occurred", {
      status: 400,
    });
  }

  // Handle the event
  const eventType = evt.type;

  if (eventType === "user.created") {
    const { id, email_addresses, username, first_name, last_name, image_url } = evt.data;
    const email = email_addresses[0]?.email_address;
    
    // Generate a username if Clerk doesn't provide one
    const generatedUsername = username || email?.split("@")[0] || `user_${Math.floor(1000 + Math.random() * 9000)}`;
    const name = [first_name, last_name].filter(Boolean).join(" ");

    try {
      await prisma.profile.create({
        data: {
          id: id,
          username: generatedUsername,
          fullName: name || null,
          avatarUrl: image_url || null,
        },
      });
      return new Response("User profile created successfully in MongoDB", { status: 201 });
    } catch (err) {
      console.error("Error creating profile in database:", err);
      return new Response("Database error", { status: 500 });
    }
  }

  return new Response("Webhook received", { status: 200 });
}
