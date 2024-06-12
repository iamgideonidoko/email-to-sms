import crypto from "node:crypto";
import express from "express";
import { config } from "dotenv";
config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.post("/", (req, res) => {
  const body = req.body;
  const signature = body.signature;

  // Secure webhook
  const encodedToken = crypto
    .createHmac("sha256", process.env.MAILGUN_WEBHOOK_KEY)
    .update(signature.timestamp.concat(signature.token))
    .digest("hex");
  if (encodedToken !== signature.signature)
    res.status(401).send("Unauthorized");

  res.status(200).send("ok");
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
