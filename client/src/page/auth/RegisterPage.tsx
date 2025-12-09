import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authApiResource from "../../api/authApi/authApiResource.ts";
import {ApiError} from "../../api/baseApi.ts";

const RegisterPage = () => {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [retypePassword, setRetypePassword] = useState('');

    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleRegister = async () => {
        setIsLoading(true);
        setMessage(null);
        try {
            const response = await authApiResource.register({
                email: email,
                userName: username,
                password: password,
                retypePassword: retypePassword,
            });

            setMessage({
                type: 'success',
                text: 'Đăng ký thành công! Chuyển đến trang đăng nhập...'
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
                // Error không xác định
                setMessage({
                    type: 'error',
                    text: 'internal server error',
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
                    alt="Register"
                    className="w-full h-full object-cover"
                />
            </div>

            <div className="w-1/2 bg-white flex items-center justify-center p-8">
                <div className="w-full max-w-md">
                    <h1 className="text-4xl font-bold text-blue-800 mb-8 text-center">
                        REGISTER
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
                                Username
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                                placeholder="Enter your username"
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

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Retype Password
                            </label>
                            <input
                                type="password"
                                value={retypePassword}
                                onChange={(e) => setRetypePassword(e.target.value)}
                                className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                                placeholder="Retype your password"
                            />
                        </div>

                        <button
                            onClick={handleRegister}
                            className="w-full bg-blue-100 text-blue-800 font-semibold py-3 px-4 rounded-lg hover:bg-blue-200 transition-colors"
                        >
                            Register
                        </button>

                        <p className="text-center text-gray-600 mt-4">
                            Đã có tài khoản?{' '}
                            <Link to="/login" className="text-blue-600 hover:text-blue-800 font-semibold">
                                Đăng nhập
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;