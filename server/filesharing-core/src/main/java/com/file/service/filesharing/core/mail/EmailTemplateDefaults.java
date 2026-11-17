package com.file.service.filesharing.core.mail;

/** Mau mac dinh vi/en, noi dung tai hien notification (fileSender.html, googleAccountLinked.html, i18n) */
final class EmailTemplateDefaults {

    private EmailTemplateDefaults() {
    }

    static EmailTemplateStore.Template of(EmailTemplateCode code, String locale) {
        boolean vi = !"en".equals(locale);
        return switch (code) {
            case FILE_SENDER -> vi
                    ? new EmailTemplateStore.Template("Một file đã được chia sẻ với bạn", fileSender(
                    "Bạn nhận được một file mới", "Xin chào,",
                    "Một file đã được chia sẻ với bạn qua File Sharing Service.", "Người gửi", "Tên file",
                    "Tải file ngay", "Link sẽ sớm hết hạn. Vui lòng tải xuống ngay.",
                    "© 2025 File Sharing Service. Bảo lưu mọi quyền.",
                    "Đây là email tự động, vui lòng không trả lời."))
                    : new EmailTemplateStore.Template("A file has been shared with you", fileSender(
                    "You received a new file", "Hello,",
                    "A file has been shared with you via our secure File Sharing Service.", "From Sender",
                    "File Name", "Download File Now", "Link will expire soon. Please download it immediately.",
                    "© 2025 File Sharing Service. All rights reserved.",
                    "This is an automated email, please do not reply."));
            case GOOGLE_ACCOUNT_LINKED -> vi
                    ? new EmailTemplateStore.Template("Cảnh báo: Tài khoản Google vừa được liên kết", googleLinked(
                    "Cảnh báo bảo mật tài khoản", "Xin chào,",
                    "Một tài khoản Google vừa được liên kết với tài khoản của bạn",
                    "Nếu đây không phải là bạn, vui lòng liên hệ hỗ trợ ngay lập tức.",
                    "© 2026 File Sharing Service.", "Đây là email tự động, vui lòng không trả lời."))
                    : new EmailTemplateStore.Template("Warning: A Google account was just linked", googleLinked(
                    "Account security alert", "Hello,",
                    "A Google account has just been linked to your account",
                    "If this was not you, please contact support immediately.",
                    "© 2026 File Sharing Service.", "This is an automated email, please do not reply."));
        };
    }

    private static final String FILE_SENDER_HTML = """
            <!DOCTYPE html>
            <html>
            <head>
            <meta charset="UTF-8">
            <meta content="width=device-width, initial-scale=1.0" name="viewport">
            <style>
            body { margin: 0; padding: 0; width: 100%; background-color: #f4f4f4; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
            .header { background-color: #2563eb; padding: 30px 20px; text-align: center; color: #ffffff; }
            .content { padding: 40px 30px; color: #333333; }
            .btn { display: inline-block; padding: 14px 28px; background-color: #2563eb; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; margin-top: 10px; }
            .footer { background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 12px; color: #888888; }
            .label { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; font-weight: bold; }
            .value { font-size: 16px; color: #1e293b; margin-top: 4px; margin-bottom: 16px; font-weight: 500; word-break: break-all; }
            </style>
            </head>
            <body>
            <div style="padding: 40px 0;">
            <table align="center" border="0" cellpadding="0" cellspacing="0" class="container" role="presentation" style="max-width: 600px;" width="100%">
            <tr><td align="center" bgcolor="#2563eb" class="header">
            <h1 style="margin: 0; font-size: 24px; font-weight: bold;">File Sharing Service</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">@TAGLINE@</p>
            </td></tr>
            <tr><td bgcolor="#ffffff" class="content">
            <p style="margin-top: 0;">@HELLO@</p>
            <p>@INTRO@</p>
            <div style="margin-top: 25px;">
            <div class="label">@FROM@</div>
            <div class="value">{{senderEmail}}</div>
            </div>
            <table border="0" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin: 10px 0 25px 0;" width="100%">
            <tr><td style="padding: 20px;">
            <div class="label">@FILE@</div>
            <div class="value" style="margin-bottom: 0; color: #0f172a;">📄 <span>{{fileName}}</span></div>
            </td></tr>
            </table>
            <div style="text-align: center; margin-top: 30px;">
            <a class="btn" target="_blank" href="{{downloadLink}}">@DOWNLOAD@</a>
            <p style="margin-top: 20px; font-size: 13px; color: #94a3b8;">@EXPIRE@</p>
            </div>
            </td></tr>
            <tr><td align="center" bgcolor="#f4f4f4" class="footer">
            <p style="margin: 0;">@RIGHTS@</p>
            <p style="margin: 5px 0 0 0;">@AUTO@</p>
            </td></tr>
            </table>
            </div>
            </body>
            </html>
            """;

    private static final String GOOGLE_LINKED_HTML = """
            <!DOCTYPE html>
            <html>
            <head>
            <meta charset="UTF-8">
            <meta content="width=device-width, initial-scale=1.0" name="viewport">
            <style>
            body { margin: 0; padding: 0; width: 100%; background-color: #f4f4f4; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
            .header { background-color: #b45309; padding: 30px 20px; text-align: center; color: #ffffff; }
            .content { padding: 40px 30px; color: #333333; }
            .footer { background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 12px; color: #888888; }
            </style>
            </head>
            <body>
            <div style="padding: 40px 0;">
            <table align="center" border="0" cellpadding="0" cellspacing="0" class="container" role="presentation" style="max-width: 600px;" width="100%">
            <tr><td align="center" bgcolor="#b45309" class="header">
            <h1 style="margin: 0; font-size: 22px; font-weight: bold;">@TITLE@</h1>
            </td></tr>
            <tr><td bgcolor="#ffffff" class="content">
            <p style="margin-top: 0;">@HELLO@</p>
            <p><span>@BODY@</span> (<span>{{toEmail}}</span>).</p>
            <p style="margin-top: 20px; color: #b45309; font-weight: bold;">@WARNING@</p>
            </td></tr>
            <tr><td align="center" bgcolor="#f4f4f4" class="footer">
            <p style="margin: 0;"><span>@RIGHTS@</span> <span>@AUTO@</span></p>
            </td></tr>
            </table>
            </div>
            </body>
            </html>
            """;

    private static String fileSender(String tagline, String hello, String intro, String from, String file,
                                     String download, String expire, String rights, String auto) {
        return FILE_SENDER_HTML.replace("@TAGLINE@", tagline).replace("@HELLO@", hello).replace("@INTRO@", intro)
                .replace("@FROM@", from).replace("@FILE@", file).replace("@DOWNLOAD@", download)
                .replace("@EXPIRE@", expire).replace("@RIGHTS@", rights).replace("@AUTO@", auto);
    }

    private static String googleLinked(String title, String hello, String body, String warning, String rights,
                                       String auto) {
        return GOOGLE_LINKED_HTML.replace("@TITLE@", title).replace("@HELLO@", hello).replace("@BODY@", body)
                .replace("@WARNING@", warning).replace("@RIGHTS@", rights).replace("@AUTO@", auto);
    }
}
