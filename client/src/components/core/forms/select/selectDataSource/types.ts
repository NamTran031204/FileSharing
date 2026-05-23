import type { BaseOptionType, DefaultOptionType } from 'antd/es/select';
import type { ReactNode } from 'react';

export interface ICusCommonSelectOption extends BaseOptionType {
  label?: ReactNode;
  value?: string | number | null;
  children?: Omit<DefaultOptionType, 'children'>[];
  /** Full-text-search key — chuỗi search được normalize trước. */
  fts?: string | null;
}

export interface SelectDataSource {
  data: ICusCommonSelectOption[];
  isPending: boolean;
}
