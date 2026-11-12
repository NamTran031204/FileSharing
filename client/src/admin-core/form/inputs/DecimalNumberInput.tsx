import {InputNumber, type InputNumberProps} from "antd";
import NumberUtil from "@plugin-core/shared/utils/number.util";

export interface DecimalNumberInputProp extends InputNumberProps<string | number> {
    decimalLimit?: number; // Số chữ số thập phân
    integerLimit?: number; // Số chữ số phần nguyên
    isOnlyNumberInput?: boolean; // Chỉ cho phép nhập số
    allowNegative?: boolean; // Cho phép nhập số âm
}

export const DecimalNumberInput = (props: DecimalNumberInputProp) => {
    const {
        integerLimit = 13,
        decimalLimit = 5,
        allowNegative,
        isOnlyNumberInput,
        ...restProps
    } = props;

    const formatNumberWithCommas = (value: string | undefined): string => {
        if (value) {
            return NumberUtil.formatString({
                value: value,
                // decimalLimit: decimalLimit,
                // integerLimit: integerLimit,
                // padDecimal: true
            }) || '';
        }
        return '';
    };

    const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
        const charCode = event.which || event.keyCode;
        const charStr = String.fromCharCode(charCode);
        const cursorPosition = event.currentTarget.selectionStart;
        const currentValue = event.currentTarget.value;
        const isInputIntegerPart = getIsInputIntegerPart(currentValue || '', cursorPosition || 0);

        // eslint-disable-next-line prefer-const -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
        let [integerPart, decimalPart] = currentValue
            .replace('-', '')
            .replace(/,/g, '')
            .split('.');
        if (integerPart) {
            integerPart = integerPart.replace(/,/g, '');
        }
        // Xử lý khi chỉ cho phép nhập số
        if (isOnlyNumberInput) {
            if (!/\d/.test(charStr)) {
                event.preventDefault();
                return;
            }
            if (currentValue.replace(/,/g, '').length >= integerLimit) {
                event.preventDefault();
                return;
            }
            return;
        } else {
            if (
                !/[\d.-]/.test(charStr) || // Chỉ cho phép số, dấu '.' và '-'
                (charStr === '.' && currentValue.includes('.')) || // Không cho phép nhiều dấu '.'
                (charStr === '-' && (currentValue.includes('-') || !allowNegative)) || // Không cho phép nhiều dấu '-' hoặc không cho phép số âm
                (charStr === '-' && currentValue.length > 0) // Dấu '-' chỉ được ở đầu
            ) {
                event.preventDefault();
                return;
            }
        }
        // Giới hạn độ dài phần nguyên
        if (integerPart && integerPart.length > integerLimit) {
            event.preventDefault();
            return;
        }

        if (integerPart.length == integerLimit) {

            if (/\d/.test(charStr) && (currentValue.indexOf('.') == -1 || isInputIntegerPart)) {
                event.preventDefault();
                return;
            }
        }
        if (!decimalPart) {
            if (integerLimit == integerPart.length
                && /\d/.test(charStr)
                && currentValue.indexOf('.') == -1) {
                event.preventDefault();
                return;
            }
        } else {
            const cursorPosition = event.currentTarget.selectionStart;
            if (cursorPosition == currentValue.length &&
                decimalLimit && decimalPart.length == decimalLimit) {
                event.preventDefault();
                return;
            }
        }
    };
    const getIsInputIntegerPart = (currentValue: string, cursorPosition: number) => {
        const splitCommas = currentValue.split('.');
        if (splitCommas.length == 1) {
            return true;
        }
        return cursorPosition <= splitCommas[0].length;
    }
    return (
        <InputNumber<string | number>
            stringMode
            className="w-full"
            {...restProps}
            value={props.value as string}
            onChange={(val) => {
                // Đảm bảo val là string
                const safeVal = val?.toString() ?? '';
                props.onChange?.(safeVal);
            }}
            formatter={(value) => {
                return formatNumberWithCommas(value?.toString());
            }}
            parser={(value) => {
                if (!value) return '';
                const stripped = value.replace(/,/g, '');
                // const a = new Decimal(stripped);
                // const b = new Decimal('0.01');
                // const sum = a.plus(b);
                // const diff = a.minus(b);
                // const product = a.times(b);
                // const quotient = a.div(b);
                // console.log('Cộng:', sum.toString());
                // console.log('Trừ:', diff.toString());
                // console.log('Nhân:', product.toString());
                // console.log('Chia:', quotient.toString());
                return stripped;
            }}
            onKeyPress={handleKeyPress}
        />

    );
}
