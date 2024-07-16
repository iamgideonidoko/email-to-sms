import { config } from "dotenv";
import mailgun from "mailgun-js";
import db from "./db.js";
config();

const apiKey = process.env.MAILGUN_ACCESS_KEY,
  domain = process.env.MAILGUN_DOMAIN,
  mg = mailgun({ apiKey, domain });

async function sendEmail(subject, text) {
  db.users.forEach(async (user) => {
    const data = {
      from: `Demo Campaign <mailgun@${domain}>`,
      to: user.email,
      subject,
      text,
    };
    try {
      await mg.messages().send(data);
      console.log("Email sent to: ", user.email);
    } catch (e) {
      console.error("Error sending email: ", e);
    }
  });
}

await sendEmail(
  "Up to 50% Off Starts Now!",
  `Dear Customer,

We are excited to announce our limited-time offer on our latest products. Enjoy up to 50% off on selected items.

Offer Details:
- 50% off on Electronics
- 30% off on Clothing
- 20% off on Accessories

Hurry, the offer ends on July 31, 2024!

Visit our store: www.example.com

Best regards
`,
);
