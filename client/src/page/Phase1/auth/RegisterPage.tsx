import {useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import authApiResource from "../../../api/authApi/authApiResource.ts";
import {ApiError} from "../../../api/baseApi.ts";
import i18n from '../../../i18n';

const RegisterPage = () => {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleRegister = async () => {
        setIsLoading(true);
        setMessage(null);
        try {
            await authApiResource.register({
                email: email,
                userName: username,
                password: password,
                confirmPassword: confirmPassword,
            });

            setMessage({
                type: 'success',
                text: i18n.t('auth:registerPage.dangKyThanhCongChuyen')
            });
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (error) {
            if (error instanceof ApiError) {
                setMessage({
                    type: 'error',
                    text: `[${error.code}]: ${error.message}`
                })
            } else {
                setMessage({
                    type: 'error',
                    text: i18n.t('auth:registerPage.internalServerError'),
                });
            }
        } finally {
            setIsLoading(false);
        }

    };

    return (
        <div className="min-h-screen flex">
            <div className="w-1/2 bg-gradient-to-br from-blue-400 to-blue-600">
                <img
                    src="/wallpaperflare.com_wallpaper.jpg"
                    alt={i18n.t('auth:registerPage.register')}
                    className="w-full h-full object-cover"
                />
            </div>

            <div className="w-1/2 bg-white flex items-center justify-center p-8">
                <div className="w-full max-w-md">
                    <h1 className="text-4xl font-bold text-blue-800 mb-8 text-center">
                        {i18n.t('auth:registerPage.register2')}
                    </h1>

                    <div className="space-y-6">
                        {message && (
                            <div className={`p-4 rounded-lg ${
                                message.type === 'success'
                                    ? 'bg-green-100 text-green-800 border border-green-300'
                                    : 'bg-red-100 text-red-800 border border-red-300'
                            }`}>
                                <p className="text-sm font-medium">{message.text}</p>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {i18n.t('auth:registerPage.email')}
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                                placeholder={i18n.t('auth:registerPage.enterYourEmail')}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {i18n.t('auth:registerPage.username')}
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                                placeholder={i18n.t('auth:registerPage.enterYourUsername')}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {i18n.t('auth:registerPage.password')}
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                                placeholder={i18n.t('auth:registerPage.enterYourPassword')}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {i18n.t('auth:registerPage.retypePassword')}
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                                placeholder={i18n.t('auth:registerPage.retypeYourPassword')}
                            />
                        </div>

                        <button
                            onClick={handleRegister}
                            className="w-full bg-blue-100 text-blue-800 font-semibold py-3 px-4 rounded-lg hover:bg-blue-200 transition-colors"
                        >
                            {i18n.t('auth:registerPage.register')}
                        </button>

                        <p className="text-center text-gray-600 mt-4">
                            {i18n.t('auth:registerPage.daCoTaiKhoan')}{' '}
                            <Link to="/login" className="text-blue-600 hover:text-blue-800 font-semibold">
                                {i18n.t('auth:registerPage.dangNhap')}
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;