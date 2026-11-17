package server.filesharingnotification.consumer;

import com.file.service.filesharing.core.exceptions.ErrorCode;
import com.file.service.filesharing.core.exceptions.specException.FileBusinessException;
import jakarta.mail.MessagingException;
import org.junit.jupiter.api.Test;
import org.springframework.kafka.support.Acknowledgment;
import server.filesharingnotification.entity.dto.EmailSenderRequestDto;
import server.filesharingnotification.entity.dto.EmailType;
import server.filesharingnotification.service.EmailService;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class EmailConsumerTest {

    EmailService emailService = mock(EmailService.class);
    Acknowledgment ack = mock(Acknowledgment.class);
    EmailConsumer consumer = new EmailConsumer(emailService);

    EmailSenderRequestDto msg() {
        EmailSenderRequestDto d = new EmailSenderRequestDto();
        d.setToEmail("bob@example.com");
        d.setType(EmailType.DOWNLOAD_LINK);
        return d;
    }

    @Test
    void thanhCong_ack() {
        consumer.consume(msg(), ack);
        verify(ack).acknowledge();
    }

    @Test
    void loiCipher_khongAck() throws Exception {
        doThrow(new FileBusinessException(ErrorCode.SETTING_CIPHER_FAILED)).when(emailService).sendDownloadLinkViaEmail(any());
        consumer.consume(msg(), ack);
        verify(ack, never()).acknowledge();
    }

    @Test
    void loiSmtp_khongAck() throws Exception {
        doThrow(new MessagingException("x")).when(emailService).sendDownloadLinkViaEmail(any());
        consumer.consume(msg(), ack);
        verify(ack, never()).acknowledge();
    }

    @Test
    void loiTemplate_ackDeKhongKetHangDoi() throws Exception {
        doThrow(new FileBusinessException(ErrorCode.EMAIL_TEMPLATE_INVALID)).when(emailService).sendDownloadLinkViaEmail(any());
        consumer.consume(msg(), ack);
        verify(ack).acknowledge();
    }
}
