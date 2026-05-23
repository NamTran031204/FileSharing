import { Col } from 'antd';
import type { CSSProperties, ReactNode } from 'react';
import { useResponsiveSpan } from '../../../hooks/useResponsiveSpan.ts';

interface ColSpanResponsiveProps {
  span: number;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

const ColSpanResponsive = ({ span, children, className, style }: ColSpanResponsiveProps) => {
  const spanRep = useResponsiveSpan(span);
  return (
    <Col span={span} className={className} style={style} {...spanRep}>
      {children}
    </Col>
  );
};

export default ColSpanResponsive;
