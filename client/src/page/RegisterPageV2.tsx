import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Divider, Form, Input, theme } from 'antd';
import { EyeInvisibleOutlined, EyeOutlined } from '@ant-design/icons';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import authApiResource from '../api/authApi/authApiResource.ts';
import { ApiError } from '../api/baseApi.ts';
import logo from '../assets/logo/logo2k.png';
import uiUtils from '../utils/uiUtils.tsx';

interface RegisterFormValues {
  email: string;
  password: string;
  confirmPassword: string;
  userName: string;
}

const RegisterPageV2 = () => {
  const { token } = theme.useToken();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleFinish = async (values: RegisterFormValues) => {
    setIsSubmitting(true);
    try {
      await authApiResource.register(values);
      uiUtils.showSuccess('Đăng ký thành công, vui lòng đăng nhập');
      navigate('/loginv2');
    } catch (err) {
      uiUtils.showError(err instanceof Error ? err.message : 'Đăng ký thất bại');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      uiUtils.showError('Không lấy được thông tin từ Google');
      return;
    }
    setIsSubmitting(true);
    try {
      await authApiResource.registerWithGoogle(credentialResponse.credential);
      navigate('/my-files');
    } catch (err) {
      if (err instanceof ApiError && err.code === '5203') {
        uiUtils.showError('Email này đã được liên kết với một tài khoản Google khác');
      } else {
        uiUtils.showError(err instanceof Error ? err.message : 'Đăng ký Google thất bại');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-grow flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[480px]">
          <div
            className="bg-card rounded-lg p-10 flex flex-col gap-8 border"
            style={{
              borderColor: `${token.colorBorderSecondary}1A`,
              boxShadow: '0 8px 30px rgba(59, 58, 126, 0.06)',
            }}
          >
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-xl overflow-hidden shadow-sm">
                <img
                  className="w-full h-full object-cover"
                  alt="Media Review Platform logo"
                  src={logo}
                />
              </div>
              <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">ASSETS</h1>
                <p className="text-sm text-muted-foreground font-medium">Tạo tài khoản mới</p>
              </div>
            </div>

            <Form<RegisterFormValues> layout="vertical" onFinish={handleFinish} requiredMark={false} className="space-y-1">
              <Form.Item
                label={<span className="text-xs font-bold uppercase tracking-[0.05em] text-muted-foreground">Tên hiển thị</span>}
                name="userName"
              >
                <Input size="large" placeholder="Tên của bạn" className="h-12 rounded-lg" />
              </Form.Item>

              <Form.Item
                label={<span className="text-xs font-bold uppercase tracking-[0.05em] text-muted-foreground">Email</span>}
                name="email"
                rules={[
                  { required: true, message: 'Vui lòng nhập email' },
                  { type: 'email', message: 'Email không hợp lệ' },
                ]}
              >
                <Input size="large" placeholder="your@email.com" className="h-12 rounded-lg" />
              </Form.Item>

              <Form.Item
                label={<span className="text-xs font-bold uppercase tracking-[0.05em] text-muted-foreground">Mật khẩu</span>}
                name="password"
                rules={[
                  { required: true, message: 'Vui lòng nhập mật khẩu' },
                  { min: 8, message: 'Mật khẩu tối thiểu 8 ký tự' },
                ]}
              >
                <Input.Password
                  size="large"
                  placeholder="Tối thiểu 8 ký tự"
                  className="h-12 rounded-lg"
                  iconRender={(visible) => (visible ? <EyeOutlined /> : <EyeInvisibleOutlined />)}
                />
              </Form.Item>

              <Form.Item
                label={<span className="text-xs font-bold uppercase tracking-[0.05em] text-muted-foreground">Xác nhận mật khẩu</span>}
                name="confirmPassword"
                dependencies={['password']}
                rules={[
                  { required: true, message: 'Vui lòng xác nhận mật khẩu' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Mật khẩu xác nhận không khớp'));
                    },
                  }),
                ]}
              >
                <Input.Password
                  size="large"
                  placeholder="Nhập lại mật khẩu"
                  className="h-12 rounded-lg"
                  iconRender={(visible) => (visible ? <EyeOutlined /> : <EyeInvisibleOutlined />)}
                />
              </Form.Item>

              <Form.Item className="!mb-0 !mt-4">
                <Button type="primary" htmlType="submit" loading={isSubmitting} className="!w-full !h-12 !rounded-lg !font-semibold">
                  Đăng Ký
                </Button>
              </Form.Item>
            </Form>

            <Divider className="!my-0 !text-xs !font-bold !uppercase !tracking-widest text-muted-foreground">hoặc</Divider>

            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => uiUtils.showError('Đăng ký Google thất bại')}
                text="signup_with"
                shape="rectangular"
                width={320}
              />
            </div>

            <p className="text-center text-sm text-muted-foreground">
              Đã có tài khoản?
              <Link to="/loginv2" className="font-bold text-primary-dark hover:underline underline-offset-4 ml-1">
                Đăng nhập
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default RegisterPageV2;
