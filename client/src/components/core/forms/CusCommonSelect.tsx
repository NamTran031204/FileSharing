import { Select, type SelectProps, type RefSelectProps } from 'antd';
import { DownOutlined, CheckOutlined } from '@ant-design/icons';
import { debounce } from 'lodash';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toLowerCaseNonAccentVietnamese } from '../../../utils/text.util.ts';
import type { ICusCommonSelectOption, SelectDataSource } from './select/selectDataSource/types.ts';

export interface ICusCommonSelectProp extends Omit<SelectProps, 'options'> {
  datasource: SelectDataSource;
  autoFocus?: boolean;
  newOption?: ICusCommonSelectOption;
  placeHolder?: string;
}

const CusCommonSelect = (props: ICusCommonSelectProp) => {
  const {
    datasource,
    autoFocus,
    newOption,
    placeholder,
    placeHolder,
    className,
    ...rest
  } = props;

  const [options, setOptions] = useState<ICusCommonSelectOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [forceUpdate, setForceUpdate] = useState<number>(Date.now());
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const selectRef = useRef<RefSelectProps>(null);

  const handleResize = useMemo(
    () => debounce(() => setForceUpdate(Date.now()), 300),
    [],
  );

  useEffect(() => {
    setOptions(datasource.data ?? []);
    setLoading(Boolean(datasource.isPending));
  }, [datasource]);

  useEffect(() => {
    if (autoFocus) {
      const timer = setTimeout(() => selectRef.current?.focus(), 600);
      return () => clearTimeout(timer);
    }
  }, [autoFocus]);

  useEffect(() => {
    if (newOption && newOption.value != null) {
      setOptions((prev) => [newOption, ...prev]);
    }
  }, [newOption]);

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      handleResize.cancel();
    };
  }, [handleResize]);

  const onSearchOption = (input: string, option?: ICusCommonSelectOption): boolean => {
    const fts = option?.fts;
    const ftsStr = Array.isArray(fts) ? fts.join(' ') : fts || '';
    return ftsStr
      .toLowerCase()
      .includes(toLowerCaseNonAccentVietnamese(input.trim().toLowerCase()));
  };

  return (
    <Select
      ref={selectRef}
      className={`w-full ord-select ${className ?? ''}`}
      {...rest}
      placeholder={placeholder ?? placeHolder ?? 'Vui lòng chọn'}
      options={options}
      loading={loading}
      suffixIcon={
        <span
          onMouseDown={(e) => {
            e.preventDefault();
            setDropdownOpen((prev) => !prev);
          }}
        >
          <DownOutlined className="text-base text-primary" />
        </span>
      }
      open={dropdownOpen}
      onDropdownVisibleChange={(visible) => setDropdownOpen(visible)}
      showSearch
      menuItemSelectedIcon={<CheckOutlined />}
      key={forceUpdate}
      filterOption={(input, option) => onSearchOption(input, option as ICusCommonSelectOption)}
      notFoundContent={
        loading ? (
          <span className="text-sm text-muted-foreground">Đang tải...</span>
        ) : (
          <span className="text-sm text-muted-foreground">Không có dữ liệu</span>
        )
      }
    />
  );
};

export default CusCommonSelect;
