import { useState, type CSSProperties, type ReactNode } from 'react';
import { Space } from 'antd';
import './index.css';

interface FloatLabelProps {
  label?: ReactNode;
  children: ReactNode;
  required?: boolean;
  style?: CSSProperties;
  className?: string;
}

const FloatLabel = ({ label, children, required, style, className }: FloatLabelProps) => {
  const [, setFocus] = useState(false);

  return (
    <div
      className={`float-label ${className ?? ''}`}
      onBlur={() => setFocus(false)}
      onFocus={() => setFocus(true)}
      style={style}
    >
      {children}
      <label className="label as-label">
        {label}
        {required && (
          <Space>
            <span className="text-destructive">(*)</span>
          </Space>
        )}
      </label>
    </div>
  );
};

export default FloatLabel;
