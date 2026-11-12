import {Input} from "antd";
import {debounce} from "lodash";
import {useCallback} from "react";
import UiUtils from "@plugin-core/shared/utils/ui.utils";
import {l} from "@plugin-core/shared/language/lang.utils";

const OrdInputTextMaxLenght = (props: {
  maxLength: number;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  firstFocusRef?: React.MutableRefObject<null>;
}) => {
  // Sử dụng debounce để hạn chế số lần gọi message.error
  const { maxLength } = props;

  const handleChange = useCallback(
    debounce((value) => {
      if (value.length >= maxLength) {
        UiUtils.showError(
          `${l.transCommon("errorTextMaxLenght")} ${maxLength}`
        );
      }
    }, 300), // Delay 300ms
    [maxLength]
  );

  return (
    <Input
      value={props.value}
      maxLength={maxLength}
      onChange={(e) => {
        handleChange(e.target.value);
        props.onChange?.(e); // Gọi onChange để cập nhật Form.Item
      }}
      ref={props.firstFocusRef ? props.firstFocusRef : null}
    />
  );
};

export default OrdInputTextMaxLenght;
