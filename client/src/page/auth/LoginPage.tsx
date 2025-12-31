import {useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import authApiResource from "../../api/authApi/authApiResource.ts";

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
                    alt="Login"
                    className="w-full h-full object-cover"
                />
            </div>

            <div className="w-1/2 bg-white flex items-center justify-center p-8">
                <div className="w-full max-w-md">
                    <h1 className="text-4xl font-bold text-blue-800 mb-8 text-center">
                        LOGIN
                    </h1>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                                placeholder="Enter your email"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                                placeholder="Enter your password"
                            />
                        </div>

                        <button
                            onClick={handleLogin}
                            className="w-full bg-blue-100 text-blue-800 font-semibold py-3 px-4 rounded-lg hover:bg-blue-200 transition-colors"
                        >
                            Login
                        </button>

                        <p className="text-center text-gray-600 mt-4">
                            Chưa có tài khoản?{' '}
                            <Link to="/register" className="text-blue-600 hover:text-blue-800 font-semibold">
                                Đăng ký
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;