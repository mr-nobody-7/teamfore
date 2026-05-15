import * as Brevo from "@getbrevo/brevo";

const apiInstance = new Brevo.TransactionalEmailsApi();
apiInstance.setApiKey(
  Brevo.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY!,
);

const SENDER = {
  name: process.env.BREVO_SENDER_NAME || "TeamFore",
  email: process.env.BREVO_SENDER_EMAIL || "noreply@teamfore.com",
};

const REPLY_TO = {
  email: process.env.BREVO_REPLY_TO || "support@teamfore.com",
  name: "TeamFore Support",
};

const EMAIL_FOOTER = `
<p style="font-size:12px; color:#6b7280; margin-top:32px; border-top:1px solid #e5e7eb; padding-top:16px;">
  You're receiving this because you use TeamFore at 
  <a href="https://teamfore.com">teamfore.com</a>.<br>
  Questions? Reply to this email or contact 
  <a href="mailto:support@teamfore.com">help@teamfore.com</a>
</p>
`;

export async function sendMail(
  to: string,
  subject: string,
  htmlContent: string,
  name?: string,
): Promise<void> {
  const email = new Brevo.SendSmtpEmail();
  email.sender = SENDER;
  email.replyTo = REPLY_TO;
  const recipient = name ? { email: to, name } : { email: to };
  email.to = [recipient];
  email.subject = subject;
  email.htmlContent = htmlContent + EMAIL_FOOTER;

  await apiInstance.sendTransacEmail(email);
}
