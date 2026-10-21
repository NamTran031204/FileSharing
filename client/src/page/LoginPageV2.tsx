import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Checkbox, Divider, Form, Input, theme } from 'antd';
import { EyeInvisibleOutlined, EyeOutlined } from '@ant-design/icons';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import authApiResource from '../api/authApi/authApiResource.ts';
import { ApiError } from '../api/baseApi.ts';
import uiUtils from '../utils/uiUtils.tsx';
import logo from '../assets/logo/logo2k.png';
import i18n from '../i18n';

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
        navigate('/home');
      }, 2000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      uiUtils.showError(i18n.t('auth:loginPageV2.khongLayDuocThongTin'));
      return;
    }
    setIsSubmitting(true);
    try {
      await authApiResource.loginWithGoogle(credentialResponse.credential);
      navigate('/home');
    } catch (err) {
      if (err instanceof ApiError && err.code === '5203') {
        uiUtils.showError(i18n.t('auth:loginPageV2.chuaCoTaiKhoanVui'));
      } else {
        uiUtils.showError(err instanceof Error ? err.message : i18n.t('auth:loginPageV2.dangNhapGoogleThatBai'));
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
                  alt={i18n.t('auth:loginPageV2.mediaReviewPlatformLogo')}
                  src={logo}
                />
              </div>
              <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">ASSETS</h1>
                <p className="text-sm text-muted-foreground font-medium">{i18n.t('auth:loginPageV2.welcomeBack')}</p>
              </div>
            </div>

            <Form<LoginFormValues> layout="vertical" onFinish={handleFinish} requiredMark={false} className="space-y-1">
              <Form.Item
                label={<span className="text-xs font-bold uppercase tracking-[0.05em] text-muted-foreground">{i18n.t('auth:loginPageV2.email')}</span>}
                name="email"
                rules={[
                  { required: true, message: i18n.t('auth:loginPageV2.vuiLongNhapEmail') },
                  { type: 'email', message: i18n.t('auth:loginPageV2.emailKhongHopLe') },
                ]}
              >
                <Input size="large" placeholder="your@email.com" className="h-12 rounded-lg" />
              </Form.Item>

              <Form.Item
                label={<span className="text-xs font-bold uppercase tracking-[0.05em] text-muted-foreground">{i18n.t('auth:loginPageV2.password')}</span>}
                name="password"
                rules={[{ required: true, message: i18n.t('auth:loginPageV2.vuiLongNhapMatKhau') }]}
              >
                <Input.Password
                  size="large"
                  placeholder={i18n.t('auth:loginPageV2.nhapMatKhau')}
                  className="h-12 rounded-lg"
                  iconRender={(visible) => (visible ? <EyeOutlined /> : <EyeInvisibleOutlined />)}
                />
              </Form.Item>

              <div className="flex items-center justify-between pb-2">
                <Form.Item name="remember" valuePropName="checked" noStyle>
                  <Checkbox>{i18n.t('auth:loginPageV2.rememberMeFor30Days')}</Checkbox>
                </Form.Item>
                <Button type="link" className="!px-0 !text-sm !font-semibold">
                  {i18n.t('auth:loginPageV2.quenMatKhau')}
                </Button>
              </div>

              <Form.Item className="!mb-0">
                <Button type="primary" htmlType="submit" loading={isSubmitting} className="!w-full !h-12 !rounded-lg !font-semibold">
                  {i18n.t('auth:loginPageV2.dangNhap')}
                </Button>
              </Form.Item>
            </Form>

            <Divider className="!my-0 !text-xs !font-bold !uppercase !tracking-widest text-muted-foreground">{i18n.t('auth:loginPageV2.hoac')}</Divider>

            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => uiUtils.showError(i18n.t('auth:loginPageV2.dangNhapGoogleThatBai'))}
                text="continue_with"
                shape="rectangular"
                width={320}
              />
            </div>

            <p className="text-center text-sm text-muted-foreground">
              {i18n.t('auth:loginPageV2.chuaCoTaiKhoan')}
              <Link to="/registerv2" className="font-bold text-primary-dark hover:underline underline-offset-4 ml-1">
                {i18n.t('auth:loginPageV2.dangKy')}
              </Link>
            </p>
          </div>

          <div className="mt-8 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-50">{i18n.t('auth:loginPageV2.chuyenTrangDanhChoNguoi')}</p>
          </div>
        </div>
      </main>

      <footer className="w-full py-12 bg-muted flex flex-col md:flex-row justify-between items-center px-12 gap-6 mt-auto">
        <div className="text-primary text-xs font-medium uppercase tracking-[0.05em]">
          {i18n.t('auth:loginPageV2.sanPhamCuaNamTran')}
        </div>
        <nav className="flex flex-wrap justify-center gap-6">
          <a className="text-xs font-medium uppercase tracking-[0.05em] text-muted-foreground hover:text-primary underline-offset-4 hover:underline transition-all duration-300" href="#">
            {i18n.t('auth:loginPageV2.gioiThieu')}
          </a>
          <a className="text-xs font-medium uppercase tracking-[0.05em] text-muted-foreground hover:text-primary underline-offset-4 hover:underline transition-all duration-300" href="#">
            Github
          </a>
          <a className="text-xs font-medium uppercase tracking-[0.05em] text-muted-foreground hover:text-primary underline-offset-4 hover:underline transition-all duration-300" href="#">
              {i18n.t('auth:loginPageV2.donateTaiDay')}
          </a>
          <a className="text-xs font-medium uppercase tracking-[0.05em] text-muted-foreground hover:text-primary underline-offset-4 hover:underline transition-all duration-300" href="#">
            {i18n.t('auth:loginPageV2.moiThacMacLienHe')}
          </a>
        </nav>
      </footer>
    </div>
  );
};

export default LoginPageV2;
