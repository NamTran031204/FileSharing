import { Button, Result, Spin } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AccessControllerService } from '../api/api/AccessControllerService';
import i18n from '../i18n';

type JoinError = 'expired' | 'invalid';

/**
 * Route /s/:token (can dang nhap). Goi join de ghi grant viaLink roi vao folder;
 * LINK_EXPIRED (5703) hien man het han, link la/tat/role null (5601) hien man link khong hop le.
 */
const JoinLinkPage = () => {
    const { token = '' } = useParams();
    const navigate = useNavigate();
    const [error, setError] = useState<JoinError | null>(null);

    useEffect(() => {
        let cancelled = false;
        setError(null);
        AccessControllerService.join({ token })
            .then((res) => {
                if (cancelled) return;
                const { projectId, folderId } = res.data ?? {};
                if (!projectId || !folderId) {
                    setError('invalid');
                    return;
                }
                navigate(`/projects/${projectId}?folderId=${folderId}`, { replace: true });
            })
            .catch((e: unknown) => {
                if (cancelled) return;
                const code = (e as { response?: { data?: { code?: string } } })?.response?.data?.code;
                setError(code === '5703' ? 'expired' : 'invalid');
            });
        return () => { cancelled = true; };
    }, [token, navigate]);

    if (!error) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <Spin tip={i18n.t('access:joinLink.joining')} size="large">
                    <div className="h-24 w-48" />
                </Spin>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
            <Result
                status="warning"
                title={i18n.t(`access:joinLink.${error}Title`)}
                subTitle={i18n.t(`access:joinLink.${error}Description`)}
                extra={
                    <Button type="primary" onClick={() => navigate('/home')}>
                        {i18n.t('access:accessDenied.goHome')}
                    </Button>
                }
            />
        </div>
    );
};

export default JoinLinkPage;
