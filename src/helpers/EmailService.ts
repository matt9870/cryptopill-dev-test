import * as mailer from 'nodemailer';
import * as Mail from 'nodemailer/lib/mailer';
import * as pug from 'pug';
import { get } from "config"
/**
 * EmailServer
 */
export class EmailServer {
  public async sendEmail(options: any): Promise<any> {
    const { EMAIL_CONFIG: { HOST, PORT, SECURE, USERNAME, PASSWORD, FROM } } = get("APP");
    const transporter = mailer.createTransport({
      host: HOST,
      port: PORT,
      secure: SECURE, // for port 465, secure must be true and for 586 secure false
      auth: {
        user: USERNAME,
        pass: PASSWORD
      }
  });
 
    const mailOptions: Mail.Options = {
      from: USERNAME,
      to: options.to,
      subject: options.subject,
      text: options.message,
      html: options.html
    };

    // if (options.templateName) {
    //   mailOptions.html = await this.getTemplate(
    //     options.templateName,
    //     options.replace,
    //   );
    // }

    return transporter.sendMail(mailOptions);
  }

  /**
   *
   * @param templateName
   */
  private async getTemplate(
    templateName: string,
    options: object = {},
  ): Promise<string> {
    return pug.renderFile(
      `${__dirname}/../../views/email-templates/${templateName}.pug`,
      options,
    );
  }
}
