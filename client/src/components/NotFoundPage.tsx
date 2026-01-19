import {useNavigate} from 'react-router-dom';
import {Button} from 'antd';
import {HomeOutlined, FrownOutlined} from '@ant-design/icons';

const NotFoundPage = () => {
    const navigate = useNavigate();

    const handleBackToHome = () => {
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-4">
            <div className="text-center max-w-md">
                {/* Icon */}
                <div className="mb-8">
                    <FrownOutlined className="text-9xl text-muted-foreground opacity-50" />
                </div>

                <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                    Oops!
                </h1>
                <h2 className="text-2xl md:text-3xl font-semibold text-muted-foreground mb-6">
                    There are no file!
                </h2>

                <p className="text-muted-foreground mb-8 text-base">
                    The file you're looking for might have been removed, deleted, or you don't have permission to access it.
                </p>

                <Button
                    type="primary"
                    size="large"
                    icon={<HomeOutlined />}
                    onClick={handleBackToHome}
                    className="min-w-[180px] h-12 text-base font-medium shadow-lg hover:scale-105 transition-transform"
                >
                    Back to Home
                </Button>

                <div className="mt-12 flex items-center justify-center gap-4">
                    <div className="h-px w-16 bg-border"></div>
                    <span className="text-xs text-muted-foreground">404</span>
                    <div className="h-px w-16 bg-border"></div>
                </div>
            </div>
        </div>
    );
};

export default NotFoundPage;
