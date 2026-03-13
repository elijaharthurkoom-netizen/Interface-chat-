import { Handler } from "@netlify/functions";

const API_KEY = "eo_b5a3c17bf3b885af48327f4e7aedf87cb1d9740d0f2444f639373992441384e5";
const LIST_ID = "d2f8c170-09ec-11f1-8328-295120792464";

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { email } = JSON.parse(event.body || "{}");

    if (!email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Email is required" }),
      };
    }

    const response = await fetch(`https://emailoctopus.com/api/1.1/lists/${LIST_ID}/contacts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: API_KEY,
        email_address: email,
        status: "SUBSCRIBED",
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      if (data.error?.code === "MEMBER_EXISTS_WITH_EMAIL_ADDRESS") {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: "This email address is already subscribed." }),
        };
      }
      
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: data.error?.message || "Failed to subscribe" }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    console.error("Subscription error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
