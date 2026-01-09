import {forwardRef, useImperativeHandle, useState} from 'react';
import {Button, Input, message, Modal, Select} from 'antd';
import {MailOutlined, SendOutlined} from '@ant-design/icons';
import userFileApiResource, {type EmailSenderRequestDto, type MetadataEntity} from '../../api/fileApi/userFileApiResource';
import {ObjectPermission} from '../../api/enums';

export interface ShareFileModalRef {
    open: (file: MetadataEntity) => void;
}

const EmailSender = forwardRef<ShareFileModalRef>((_, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [currentFile, setCurrentFile] = useState<MetadataEntity | null>(null);

    // Form state
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
        // Validation
        if (!email.trim()) {
            setEmailError('Email không được để trống');
            return;
        }

        if (!validateEmail(email)) {
            setEmailError('Email không hợp lệ');
            return;
        }

        if (permissions.length === 0) {
            message.error('Vui lòng chọn ít nhất một quyền');
            return;
        }

        if (!currentFile) {
            message.error('Không tìm thấy thông tin file');
            return;
        }

        setLoading(true);
        try {
            const uploadLink = `http//localhost:5173/preview/${currentFile.shareToken}`;

            // Map to DTO
            const requestData: EmailSenderRequestDto = {
                toEmail: email,
                objectPermission: permissions,
                uploadLink: uploadLink,
                objectName: currentFile.objectName
            };

            await userFileApiResource.sendEmail(requestData);
            message.success(`Email đã được gửi thành công đến ${email}`);
            handleClose();
        } catch (error) {
            console.error('Send email error:', error);
            message.error('Gửi email thất bại. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Permission options
     */
    const permissionOptions = [
        {
            label: 'Read Only',
            value: ObjectPermission.READ,
            description: 'Chỉ được xem file'
        },
        {
            label: 'Comment',
            value: ObjectPermission.COMMENT,
            description: 'Được xem và comment'
        },
        {
            label: 'Modify',
            value: ObjectPermission.MODIFY,
            description: 'Được xem, comment và chỉnh sửa'
        },
    ];

    return (
        <Modal
            title={
                <div className="flex items-center gap-2">
                    <MailOutlined className="text-primary" />
                    <span>Chia sẻ File qua Email</span>
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
                        <p className="text-xs text-muted-foreground mb-1">File đang chia sẻ:</p>
                        <p className="text-sm font-semibold text-foreground truncate" title={currentFile.fileName}>
                            {currentFile.fileName}
                        </p>
                    </div>
                )}

                {/* Email Input */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                        Email người nhận <span className="text-destructive">*</span>
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
                        Quyền truy cập <span className="text-destructive">*</span>
                    </label>
                    <Select
                        mode="multiple"
                        placeholder="Chọn quyền"
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
                        Người nhận sẽ có các quyền này khi truy cập file
                    </p>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-4 border-t border-border">
                    <Button
                        onClick={handleClose}
                        disabled={loading}
                    >
                        Hủy
                    </Button>
                    <Button
                        type="primary"
                        icon={<SendOutlined />}
                        onClick={handleSend}
                        loading={loading}
                    >
                        Gửi Email
                    </Button>
                </div>
            </div>
        </Modal>
    );
});

EmailSender.displayName = 'EmailSender';

export default EmailSender;
