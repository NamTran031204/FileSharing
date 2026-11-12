import {InputNumber, type InputNumberProps} from "antd";

interface Prop extends InputNumberProps<number> {
    decimalLimit?: number;
}

export const InitNumberInput = (props: Prop) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
    const {decimalLimit = 5, ...restProps} = props;
    const formatNumberWithCommas = (value: number | undefined): string => {
        if (value !== undefined) {
            const [integerPart, decimalPart] = `${value}`.toString().split('.');

            const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

            const limitedDecimalPart = decimalPart ? decimalPart.slice(0, decimalLimit) : '';

            return limitedDecimalPart ? `${formattedInteger}.${limitedDecimalPart}` : formattedInteger;
        }
        return '';
    };
    const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
        const charCode = event.which ? event.which : event.keyCode;
        const charStr = String.fromCharCode(charCode);

        // Chỉ cho phép nhập các ký tự số (0-9)
        if (!/\d/.test(charStr)) {
            event.preventDefault();
        }
    };
    return (<InputNumber<number>
        className='w-full'
        {...props}
        formatter={formatNumberWithCommas}
        parser={(value) => {
            if (value) {
                const parsedValue = value.replace(/\$\s?|(,*)/g, '');
                return parseFloat(parsedValue).toFixed(decimalLimit) as unknown as number;
            }
            return '' as unknown as number;
        }}
        onKeyPress={handleKeyPress}
    />);
}
