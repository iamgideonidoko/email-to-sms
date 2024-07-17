import { config } from "dotenv";
import mailgun from "mailgun-js";
import { nanoid } from "nanoid";
import { JSONFilePreset } from "lowdb/node";
config();

const db = await JSONFilePreset("db.json", { users: [], emails: [] });

const apiKey = process.env.MAILGUN_ACCESS_KEY,
  domain = process.env.MAILGUN_DOMAIN,
  mg = mailgun({ apiKey, domain });

const sendEmail = async (subject, text) => {
  const customMessageId = nanoid(10);
  await db.update(({ emails }) =>
    emails.push({
      id: customMessageId,
      subject,
      text,
    }),
  );
  db.data.users.forEach(async (user) => {
    const data = {
      from: `Demo Campaign <mailgun@${domain}>`,
      to: user.email,
      subject,
      text,
      "o:tracking": true,
      "v:custom-message-id": customMessageId,
    };
    try {
      await mg.messages().send(data);
      console.log("Email sent to: ", user.email);
    } catch (e) {
      console.error("Error sending email: ", e);
    }
  });
};

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
