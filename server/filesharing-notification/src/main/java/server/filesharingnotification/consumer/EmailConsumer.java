package server.filesharingnotification.consumer;

import jakarta.mail.MessagingException;
import com.file.service.filesharing.core.exceptions.ErrorCode;
import com.file.service.filesharing.core.exceptions.specException.FileBusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Component;
import server.filesharingnotification.entity.dto.EmailSenderRequestDto;
import server.filesharingnotification.entity.dto.EmailType;
import server.filesharingnotification.service.EmailService;

@Slf4j
@Component
@RequiredArgsConstructor
public class EmailConsumer {

    private final EmailService emailService;

    @KafkaListener(
            topics = "${kafka.topics.notification_email_sender:notification_email_sender}",
            groupId = "${spring.kafka.consumer.group-id:notification}",
            containerFactory = "kafkaListenerContainerFactory"
    )
    public void consume(EmailSenderRequestDto messages, Acknowledgment acknowledgment) {
        try {
            log.info("Starting to send email");

            EmailType type = messages.getType() != null ? messages.getType() : EmailType.DOWNLOAD_LINK;
            if (type == EmailType.GOOGLE_ACCOUNT_LINKED) {
                emailService.sendGoogleAccountLinkedEmail(messages);
            } else {
                emailService.sendDownloadLinkViaEmail(messages);
            }

            acknowledgment.acknowledge();
            log.info("Message acknowledged successfully for: {}", messages.getToEmail());
        } catch (FileBusinessException e) {
            if (e.getErrorCode() == ErrorCode.SETTING_CIPHER_FAILED) {
                // khong ack de message duoc gui lai sau khi SA sua khoa/mat khau; chi log ma loi, khong log secret
                log.error("Khong gui duoc email den {}: SETTING_CIPHER_FAILED (kiem tra JASYPT_ENCRYPTOR_PASSWORD), khong ack",
                        messages.getToEmail());
            } else {
                log.error("Email loi nghiep vu {}, bo qua message", e.getErrorCode());
                acknowledgment.acknowledge();
            }
        } catch (MessagingException e) {
            log.error("Failed to send email to {}: {}", messages.getToEmail(), e.getMessage(), e);
        } catch (Exception e) {
            log.error("Unexpected error processing message: {}", e.getMessage(), e);
            acknowledgment.acknowledge();
        }
    }
}
