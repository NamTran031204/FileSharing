import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react';
import { Grid, Row } from 'antd';
import type { Gutter } from 'antd/es/grid/row';

const { useBreakpoint } = Grid;

interface SmartRowProps {
  children: ReactNode;
  rowGap?: number;
  gutter?: Gutter | [Gutter, Gutter];
  align?: 'top' | 'middle' | 'bottom';
  className?: string;
}

type ColLikeProps = {
  span?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
  style?: React.CSSProperties;
};

const SmartRow = ({ children, rowGap = 16, gutter, align, className }: SmartRowProps) => {
  const screens = useBreakpoint();

  const getSpan = (props: ColLikeProps): number => {
    if (screens.xl && props.xl) return props.xl;
    if (screens.lg && props.lg) return props.lg;
    if (screens.md && props.md) return props.md;
    if (screens.sm && props.sm) return props.sm;
    return props.span ?? 24;
  };

  let currentRowSpan = 0;
  let indexInRow = 0;
  let rowIndex = 0;

  const newChildren = Children.map(children, (child) => {
    if (!isValidElement(child)) return child;

    const childProps = child.props as ColLikeProps;
    const span = getSpan(childProps);

    if (currentRowSpan + span > 24) {
      currentRowSpan = 0;
      indexInRow = 0;
      rowIndex++;
    }

    const marginLeft = indexInRow === 0 ? 0 : -indexInRow;
    const marginTop = rowIndex === 0 ? 0 : rowGap;

    currentRowSpan += span;
    indexInRow++;

    try {
      return cloneElement(child as ReactElement<ColLikeProps>, {
        style: {
          ...(childProps.style ?? {}),
          marginLeft,
          marginTop,
        },
      });
    } catch {
      return child;
    }
  });

  return (
    <Row gutter={gutter} align={align} className={`w-full ${className ?? ''}`}>
      {newChildren}
    </Row>
  );
};

export default SmartRow;
