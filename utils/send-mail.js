const nodemailer = require("nodemailer");

async function sendMail(recipients, userName, userEmail, docName, docURL) {
  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "it002ilab@gmail.com",
      pass: "kpvmudmedxebsnby",
    },
  });

  try {
    let info = await transporter.sendMail({
      from: `"Editor-Co (${userName})" <no-reply@editor-co.web.app>`,
      replyTo: `"${userName}" <${userEmail}>`,
      bcc: recipients, // list of receivers
      subject: `Document shared with you: ${docName}`, // Subject line
      html: `
      <div>
        <h2>${userEmail} has shared a document with you</h2>
        <button><a href=${docURL} target="_blank">Open</a></button>
        <p><a href=${docURL} target="_blank">${docURL}</a></p>
      </div>
    `,
    });
    console.log("Message sent: %s", info.messageId);
  } catch (err) {
    return err;
  }
  // send mail with defined transport object
}

module.exports = sendMail;
