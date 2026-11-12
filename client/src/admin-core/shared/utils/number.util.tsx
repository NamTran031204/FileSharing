interface INumberUtilParam {
    value: string | number | undefined | null;
    integerLimit?: number // Phần nguyên
    decimalLimit?: number // Phần thập phân
    padDecimal?: boolean // Thêm số 0 vào sau dấu thập phân  hay không
    nullValue?: string; // Giá trị trả về nếu không có giá trị
}

class NumberUtil {

    formatNumber(input: INumberUtilParam): number {
        const temp = this.formatString(input);
        const stripped = temp.replace(/,/g, '');
        return parseFloat(stripped);
    }

    formatString(input: INumberUtilParam): string {
        const {value, integerLimit = 20, decimalLimit = 2, padDecimal = false, nullValue = ''} = input;
        if (!value) return nullValue;
        const numberStr = typeof value === 'number' ? value.toString() : value;
        const isNegative = numberStr.startsWith('-');
        const raw = numberStr.replace(/[^0-9.]/g, '');

        const [intPart = '', decPart = ''] = raw.split('.');

        const limitedIntPart = intPart.slice(0, integerLimit);
        const limitedDecPart = decPart.slice(0, decimalLimit);

        const formattedInt = limitedIntPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

        let result: string;

        if (padDecimal && decimalLimit > 0) {
            const paddedDec = (limitedDecPart || '').padEnd(decimalLimit, '0');
            result = `${formattedInt}.${paddedDec}`;
        } else {
            result = limitedDecPart && decimalLimit > 0 ? `${formattedInt}.${limitedDecPart}` : formattedInt;
        }

        return isNegative ? `-${result}` : result;
    }

    // Bỏ Chuyển qua dùng  formatNumber
    formatNumberOld(numberValue: number | null, integerLimit = 20, decimalLimit = 5) {
        if (!numberValue) {
            return '';
        }
        return this.formatStringOld(numberValue.toString(), integerLimit, decimalLimit) || '';
    }
    // Bỏ Chuyển qua dùng  formatString
    formatStringOld(numberStr: string | null, integerLimit = 20, decimalLimit = 5) {
        if (!numberStr) {
            return null;
        }
        const isNegative = numberStr.includes('-');
        const absoluteValue = numberStr.replace(/-/, '');
        const [integerPart, decimalPart] = absoluteValue.split('.');
        const limitedIntegerPart = integerLimit
            ? integerPart.slice(0, integerLimit)
            : integerPart;

        const formattedInteger = limitedIntegerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

        const limitedDecimalPart = decimalPart
            ? decimalPart.slice(0, decimalLimit)
            : '';

        const result = limitedDecimalPart
            ? `${formattedInteger}.${limitedDecimalPart}`
            : formattedInteger;

        return isNegative ? `-${result}` : result;
    }


    //dung cho totalAmount trong kho va ban hang
    ceil(number?: number) {
        number = number || 0;
        return number % 1 >= 0.1 ? Math.floor(number) + 1 : Math.floor(number);
    }
}

export default new NumberUtil();
