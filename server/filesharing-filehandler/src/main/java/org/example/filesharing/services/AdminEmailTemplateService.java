package org.example.filesharing.services;

import org.example.filesharing.entities.dtos.admin.*;

import java.util.List;

public interface AdminEmailTemplateService {

    /** moi ma mot phan tu (lay tu catalogue EmailTemplateCode), kem trang thai vi/en */
    List<AdminEmailTemplateRowDto> list();

    AdminEmailTemplateDto get(String code, String locale);

    /** validate bang EmailTemplateRenderer.validate truoc khi luu */
    AdminEmailTemplateDto update(String code, String locale, AdminEmailTemplateUpdateDto request);

    /** xoa override, quay ve mau mac dinh */
    AdminEmailTemplateDto reset(String code, String locale);

    AdminEmailPreviewDto preview(AdminEmailPreviewRequestDto request);

    /** gui mau da luu voi gia tri mau; loi SMTP -> MAIL_TEST_FAILED */
    void sendTest(String code, String locale, String toEmail);

    /** kiem tra SMTP theo setting nhom MAIL, luon tra ket qua (khong nem loi SMTP) */
    AdminMailTestResultDto testMail(AdminMailTestRequestDto request);
}
