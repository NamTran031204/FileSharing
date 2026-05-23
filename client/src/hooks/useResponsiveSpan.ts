import { useEffect, useState } from 'react';
import type { ColProps } from 'antd/es/grid/col';

/**
 * Map 1 span (giá trị tại xl) → ColProps cho 5 breakpoint.
 *
 *  xl span  |  lg  |  md  |  sm/xs  |  Mô tả
 *  ---------+------+------+---------+---------------------------
 *  1–7      |  8   |  12  |  24     |  Field nhỏ
 *  8–15     |  16  |  24  |  24     |  Field vừa
 *  16–24    |  24  |  24  |  24     |  Field lớn — luôn full
 */
export const useResponsiveSpan = (width: number): ColProps => {
  const compute = (w: number): ColProps => ({
    span: 24,
    sm: 24,
    md: w < 8 ? 12 : 24,
    lg: w < 8 ? 8 : w < 16 ? 16 : 24,
    xl: w,
  });

  const [spanResponsive, setSpanResponsive] = useState<ColProps>(() => compute(width));

  useEffect(() => {
    setSpanResponsive(compute(width));
  }, [width]);

  return spanResponsive;
};
