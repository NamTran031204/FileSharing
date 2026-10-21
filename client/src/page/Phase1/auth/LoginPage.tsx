import {useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import authApiResource from "../../../api/authApi/authApiResource.ts";
import i18n from '../../../i18n';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async () => {
        await authApiResource.login({
            email: email,
            password: password,
        });
        setTimeout(() => {
            navigate('/my-files');
        }, 2000);
    };

    return (
        <div className="min-h-screen flex">
            <div className="w-1/2 bg-gradient-to-br from-blue-400 to-blue-600">
                <img
                    src="/wallpaperflare.com_wallpaper.jpg"
                    alt={i18n.t('auth:loginPage.login')}
                    className="w-full h-full object-cover"
                />
            </div>

            <div className="w-1/2 bg-white flex items-center justify-center p-8">
                <div className="w-full max-w-md">
                    <h1 className="text-4xl font-bold text-blue-800 mb-8 text-center">
                        {i18n.t('auth:loginPage.login2')}
                    </h1>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {i18n.t('auth:loginPage.email')}
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                                placeholder={i18n.t('auth:loginPage.enterYourEmail')}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {i18n.t('auth:loginPage.password')}
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                                placeholder={i18n.t('auth:loginPage.enterYourPassword')}
                            />
                        </div>

                        <button
                            onClick={handleLogin}
                            className="w-full bg-blue-100 text-blue-800 font-semibold py-3 px-4 rounded-lg hover:bg-blue-200 transition-colors"
                        >
                            {i18n.t('auth:loginPage.login')}
                        </button>

                        <p className="text-center text-gray-600 mt-4">
                            {i18n.t('auth:loginPage.chuaCoTaiKhoan')}{' '}
                            <Link to="/register" className="text-blue-600 hover:text-blue-800 font-semibold">
                                {i18n.t('auth:loginPage.dangKy')}
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;