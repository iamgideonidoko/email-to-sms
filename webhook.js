import crypto from "node:crypto";
import express from "express";
import { config } from "dotenv";
import axios from "axios";
import { JSONFilePreset } from "lowdb/node";
config();

const db = await JSONFilePreset("db.json", { users: [], emails: [] }); // Initialize database

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const convertEmailToSMS = (subject, text) => {
  const offerDetailsRegex = /Offer Details:\n([\s\S]+?)\n\n/,
    expiryDateRegex = /offer ends on (.+)!/,
    storeLinkRegex = /Visit our store: (.+)/;
  const offerDetailsMatch = text.match(offerDetailsRegex),
    expiryDateMatch = text.match(expiryDateRegex),
    storeLinkMatch = text.match(storeLinkRegex);
  subject = subject ? subject : "No subject";
  const offerDetails = offerDetailsMatch
      ? offerDetailsMatch[1].trim().replace(/\n/g, ", ")
      : "No offer details",
    expiryDate = expiryDateMatch ? expiryDateMatch[1] : "No expiry date",
    storeLink = storeLinkMatch ? storeLinkMatch[1] : "No store link";
  return `${subject}\n${offerDetails}\nEnds on: ${expiryDate}\nShop now: ${storeLink}`;
};

app.post("/", async (req, res) => {
  try {
    const body = req.body;
    const signature = body.signature;
    // Secure webhook
    const encodedToken = crypto
      .createHmac("sha256", process.env.MAILGUN_WEBHOOK_KEY)
      .update(signature.timestamp.concat(signature.token))
      .digest("hex");
    if (encodedToken !== signature.signature)
      throw { statusCode: 401, message: "Unauthorized" };
    const eventData = body["event-data"];
    // Log event data
    console.log("eventData: ", JSON.stringify(eventData, null, 2));
    if (eventData.event !== "delivered")
      throw {
        statusCode: 400,
        message: "Webhook only handles delivered events",
      };
    const userEmail = eventData.recipient;
    // Get the message ID passed when sending the message
    const customMessageId = eventData["user-variables"]?.["custom-message-id"];
    const dbUser = db.data.users.find((user) => user.email === userEmail);
    if (!dbUser) throw { statusCode: 400, message: "User not found" };
    const dbEmail = db.data.emails.find(
      (email) => email.id === customMessageId,
    );
    if (!dbEmail) throw { statusCode: 400, message: "Email not found" };
    // Convert email, you can get creative here and use an LLM
    const sms = convertEmailToSMS(dbEmail.subject, dbEmail.text);
    console.log("sms: ", sms);
    const userPhone = dbUser.phone;
    // Send SMS using MessageMedia API
    const base64AuthKey = btoa(
      `${process.env.MESSAGEMEDIA_API_KEY}:${process.env.MESSAGEMEDIA_API_SECRET}`,
    );
    await axios.post(
      "https://api.messagemedia.com/v1/messages",
      {
        messages: [
          {
            content: sms,
            destination_number: userPhone,
          },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${base64AuthKey}`,
          format: "SMS",
        },
      },
    );
    return res.status(200).send("ok");
  } catch (e) {
    const statusCode =
      typeof e === "object" && "statusCode" in e ? e.statusCode : 500;
    const message =
      typeof e === "object" && "message" in e ? e.message : undefined;
    console.error("Webhook Error: ", statusCode, message ?? e);
    return res.status(statusCode).send(message ?? "500");
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
