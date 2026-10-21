import {forwardRef, useImperativeHandle, useState} from 'react';
import {Button, Input, message, Modal, Select} from 'antd';
import {MailOutlined, SendOutlined} from '@ant-design/icons';
import userFileApiResource, {type EmailSenderRequestDto, type MetadataEntity} from '../../../api/fileApi/userFileApiResource.ts';
import {ObjectPermission} from '../../../api/enums.ts';
import i18n from '../../../i18n';

export interface ShareFileModalRef {
    open: (file: MetadataEntity) => void;
}

const EmailSender = forwardRef<ShareFileModalRef>((_, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [currentFile, setCurrentFile] = useState<MetadataEntity | null>(null);

    const [email, setEmail] = useState('');
    const [permissions, setPermissions] = useState<ObjectPermission[]>([ObjectPermission.READ]);
    const [emailError, setEmailError] = useState<string | null>(null);


    useImperativeHandle(ref, () => ({
        open: (file: MetadataEntity) => {
            setCurrentFile(file);
            setIsOpen(true);
            setEmail('');
            setPermissions([ObjectPermission.READ]);
            setEmailError(null);
        }
    }));

    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleClose = () => {
        if (loading) return; // Prevent closing while loading
        setIsOpen(false);
        setCurrentFile(null);
        setEmail('');
        setPermissions([ObjectPermission.READ]);
        setEmailError(null);
    };

    const handleSend = async () => {
        if (!email.trim()) {
            setEmailError(i18n.t('file:emailSender.emailKhongDuocDeTrong'));
            return;
        }

        if (!validateEmail(email)) {
            setEmailError(i18n.t('file:emailSender.emailKhongHopLe'));
            return;
        }

        if (permissions.length === 0) {
            message.error(i18n.t('file:emailSender.vuiLongChonItNhat'));
            return;
        }

        if (!currentFile) {
            message.error(i18n.t('file:emailSender.khongTimThayThongTin'));
            return;
        }

        setLoading(true);
        try {
            const uploadLink = `http//localhost:5173/preview/${currentFile.shareToken}`;

            const requestData: EmailSenderRequestDto = {
                toEmail: email,
                objectPermission: permissions,
                uploadLink: uploadLink,
                objectName: currentFile.objectName
            };

            await userFileApiResource.sendEmail(requestData);
            message.success(i18n.t('file:emailSender.emailDaDuocGuiThanh', {email}));
            handleClose();
        } catch (error) {
            console.error('Send email error:', error);
            message.error(i18n.t('file:emailSender.guiEmailThatBaiVui'));
        } finally {
            setLoading(false);
        }
    };

    /**
     * Permission options
     */
    const permissionOptions = [
        {
            label: i18n.t('file:emailSender.readOnly'),
            value: ObjectPermission.READ,
            description: i18n.t('file:emailSender.chiDuocXemFile')
        },
        {
            label: i18n.t('file:emailSender.comment'),
            value: ObjectPermission.COMMENT,
            description: i18n.t('file:emailSender.duocXemVaComment')
        },
        {
            label: i18n.t('file:emailSender.modify'),
            value: ObjectPermission.MODIFY,
            description: i18n.t('file:emailSender.duocXemCommentVaChinh')
        },
    ];

    return (
        <Modal
            title={
                <div className="flex items-center gap-2">
                    <MailOutlined className="text-primary" />
                    <span>{i18n.t('file:emailSender.chiaSeFileQuaEmail')}</span>
                </div>
            }
            open={isOpen}
            onCancel={handleClose}
            footer={null}
            width={520}
            centered
        >
            <div className="space-y-4 mt-4">
                {/* File Info */}
                {currentFile && (
                    <div className="bg-muted p-3 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">{i18n.t('file:emailSender.fileDangChiaSe')}</p>
                        <p className="text-sm font-semibold text-foreground truncate" title={currentFile.fileName}>
                            {currentFile.fileName}
                        </p>
                    </div>
                )}

                {/* Email Input */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                        {i18n.t('file:emailSender.emailNguoiNhan')} <span className="text-destructive">*</span>
                    </label>
                    <Input
                        placeholder="example@email.com"
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value);
                            setEmailError(null);
                        }}
                        status={emailError ? 'error' : ''}
                        prefix={<MailOutlined className="text-muted-foreground" />}
                        size="large"
                        disabled={loading}
                    />
                    {emailError && (
                        <p className="text-xs text-destructive mt-1">{emailError}</p>
                    )}
                </div>

                {/* Permission Select */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                        {i18n.t('file:emailSender.quyenTruyCap')} <span className="text-destructive">*</span>
                    </label>
                    <Select
                        mode="multiple"
                        placeholder={i18n.t('file:emailSender.chonQuyen')}
                        value={permissions}
                        onChange={(value) => setPermissions(value)}
                        options={permissionOptions}
                        size="large"
                        className="w-full"
                        disabled={loading}
                        optionRender={(option) => (
                            <div>
                                <div className="font-medium">{option.label}</div>
                                <div className="text-xs text-muted-foreground">
                                    {option.data.description}
                                </div>
                            </div>
                        )}
                    />
                    <p className="text-xs text-muted-foreground">
                        {i18n.t('file:emailSender.nguoiNhanSeCoCac')}
                    </p>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-4 border-t border-border">
                    <Button
                        onClick={handleClose}
                        disabled={loading}
                    >
                        {i18n.t('file:emailSender.huy')}
                    </Button>
                    <Button
                        type="primary"
                        icon={<SendOutlined />}
                        onClick={handleSend}
                        loading={loading}
                    >
                        {i18n.t('file:emailSender.guiEmail')}
                    </Button>
                </div>
            </div>
        </Modal>
    );
});

EmailSender.displayName = 'EmailSender';

export default EmailSender;
