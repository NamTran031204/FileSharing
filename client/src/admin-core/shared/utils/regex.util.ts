class RegexUtil {
  CodeRegex = /^[a-zA-Z0-9_-]*$/;
  ProductLotNumberRegex = /^[a-zA-Z0-9_\- ]*$/;
  Password =/^(?=.*[A-Z])^(?=.*[a-z])(?=.*\d)[A-Za-z\d$@$!%*#?&]{8,}$/;
  UserName = /^[a-z0-9_]{5,30}$/; // cho phép số, sau phục vụ số điện thoại
  // Email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  Email =
    // eslint-disable-next-line no-useless-escape -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
    /^(?!.*[!#$%^&*()+=\[\]{}|;:'\",<>?/\\`~])(?!.*\.\.)(?!^\.)[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?<!\.)$/;
  // Số điện thoại Việt Nam 10 chữ số: 0[3|5|7|8|9]x + một số đầu số 02x cố định
  // Viettel: 032-039, 086, 096, 097, 098
  // Mobifone: 070, 076-079, 089, 090, 093
  // Vinaphone: 081-086, 088, 091, 094
  // Gmobile: 059, 056, 058
  // Reddi (GTel): 055, 056, 058
  // Vietnamobile: 052, 058, 092
  // Indochina Telecom: 099
  // Đầu số cố định 02x: 020x (mặc dù ít phổ biến vẫn hợp lệ)
  PhoneVn =
    /^(0)(2[0-9][0-9]|3[2-9]|5[25689]|7[06-9]|8[0-9]|9[0-9])\d{7}$/;
  CCCD = /^(\d{12}|\d{9})$/;
  NumberOnly = /^\d*$/;
  AlphaNumeric = /^[a-zA-Z0-9]*$/;
  UserName2 = /^[a-z0-9]+(_[a-z0-9]+)*$/;
  TaxCode = /^\d{10}(-\d{3})?$/;
  NoWhitespace = /^\S*$/;
  NoSpecialAscii = /^[a-zA-Z0-9\u00C0-\u024F]*$/;
  OnlyNumber = /^[0-9]*$/;
  QrCCCD =/^([^|]*\|){6,11}[^|]*$/;
}

export default new RegexUtil();
