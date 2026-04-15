import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Checkbox, Divider, Form, Input, theme } from 'antd';
import { EyeInvisibleOutlined, EyeOutlined } from '@ant-design/icons';
import authApiResource from '../api/authApi/authApiResource.ts';
import logo from '../assets/logo/logo2k.png';

interface LoginFormValues {
  email: string;
  password: string;
  remember?: boolean;
}

const LoginPageV2 = () => {
  const { token } = theme.useToken();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleFinish = async (values: LoginFormValues) => {
    setIsSubmitting(true);
    try {
      await authApiResource.login({
        email: values.email,
        password: values.password,
      });
      setTimeout(() => {
        navigate('/my-files');
      }, 2000);
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
                <p className="text-sm text-muted-foreground font-medium">Welcome back!</p>
              </div>
            </div>

            <Form<LoginFormValues> layout="vertical" onFinish={handleFinish} requiredMark={false} className="space-y-1">
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
                label={<span className="text-xs font-bold uppercase tracking-[0.05em] text-muted-foreground">Password</span>}
                name="password"
                rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
              >
                <Input.Password
                  size="large"
                  placeholder="Nhập mật khẩu"
                  className="h-12 rounded-lg"
                  iconRender={(visible) => (visible ? <EyeOutlined /> : <EyeInvisibleOutlined />)}
                />
              </Form.Item>

              <div className="flex items-center justify-between pb-2">
                <Form.Item name="remember" valuePropName="checked" noStyle>
                  <Checkbox>Remember me (for 30 days)</Checkbox>
                </Form.Item>
                <Button type="link" className="!px-0 !text-sm !font-semibold">
                  Quên mật khẩu?
                </Button>
              </div>

              <Form.Item className="!mb-0">
                <Button type="primary" htmlType="submit" loading={isSubmitting} className="!w-full !h-12 !rounded-lg !font-semibold">
                  Đăng Nhập
                </Button>
              </Form.Item>
            </Form>

            <Divider className="!my-0 !text-xs !font-bold !uppercase !tracking-widest text-muted-foreground">hoặc</Divider>

            <Button className="!w-full !h-12 !rounded-lg border-border text-muted-foreground !font-semibold">
              <span className="inline-flex items-center gap-3">
                <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                <span>Tiếp tục với Google</span>
              </span>
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Chưa có tài khoản?
              <Link to="/register" className="font-bold text-primary-dark hover:underline underline-offset-4 ml-1">
                Đăng ký
              </Link>
            </p>
          </div>

          <div className="mt-8 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-50">Chuyên trang dành cho người làm media</p>
          </div>
        </div>
      </main>

      <footer className="w-full py-12 bg-muted flex flex-col md:flex-row justify-between items-center px-12 gap-6 mt-auto">
        <div className="text-primary text-xs font-medium uppercase tracking-[0.05em]">
          Sản Phẩm của Nam Trần
        </div>
        <nav className="flex flex-wrap justify-center gap-6">
          <a className="text-xs font-medium uppercase tracking-[0.05em] text-muted-foreground hover:text-primary underline-offset-4 hover:underline transition-all duration-300" href="#">
            Giới thiệu
          </a>
          <a className="text-xs font-medium uppercase tracking-[0.05em] text-muted-foreground hover:text-primary underline-offset-4 hover:underline transition-all duration-300" href="#">
            Github
          </a>
          <a className="text-xs font-medium uppercase tracking-[0.05em] text-muted-foreground hover:text-primary underline-offset-4 hover:underline transition-all duration-300" href="#">
              Donate tại đây
          </a>
          <a className="text-xs font-medium uppercase tracking-[0.05em] text-muted-foreground hover:text-primary underline-offset-4 hover:underline transition-all duration-300" href="#">
            Mọi thắc mắc liên hệ thông qua đây!
          </a>
        </nav>
      </footer>
    </div>
  );
};

export default LoginPageV2;
