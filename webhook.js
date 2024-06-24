import crypto from "node:crypto";
import express from "express";
import { config } from "dotenv";
import axios from "axios";
config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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
      return res.status(401).send("Unauthorized");

    const eventData = body["event-data"];
    const userVariables = eventData["user-variables"];
    const list = userVariables["list"];
    if (list !== "demo_list") return res.status(401).send("Not-allowed");
    const phone = userVariables["phone"];
    const username = eventData.recipient?.split("@")[0];

    const smsTemplate = `Hi ${username}, we have some specials for today only. More details in your email.`;

    // Send SMS using MessageMedia API
    const base64AuthKey = btoa(
      `${process.env.MESSAGEMEDIA_API_KEY}:${process.env.MESSAGEMEDIA_API_SECRET}`,
    );
    await axios.post(
      "https://api.messagemedia.com/v1/messages",
      {
        messages: [
          {
            content: smsTemplate,
            destination_number: phone,
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
    console.log('Webhook Error: ', e);
    return res.status(500).send("500");
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
