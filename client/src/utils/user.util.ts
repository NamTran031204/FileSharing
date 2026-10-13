// token = chuoi lien tiep chu/so (ho tro unicode, ke ca tieng Viet co dau)
const tokenize = (text?: string): string[] =>
    (text ?? '').split(/[^\p{L}\p{N}]+/u).filter(Boolean);

const firstChar = (token: string): string => Array.from(token)[0];

/**
 * Tinh toi da 2 ky tu viet tat cua user.
 * Uu tien name, sau do phan truoc '@' cua email; khong co gi -> null.
 * >= 2 token: chu dau token dau + chu dau token cuoi; 1 token: 2 ky tu dau.
 */
export const getUserInitials = ({name, email}: { name?: string; email?: string }): string | null => {
    let tokens = tokenize(name);
    if (!tokens.length) tokens = tokenize(email?.split('@')[0]);
    if (!tokens.length) return null;

    const raw = tokens.length >= 2
        ? firstChar(tokens[0]) + firstChar(tokens[tokens.length - 1])
        : Array.from(tokens[0]).slice(0, 2).join('');
    return raw.toLocaleUpperCase();
};
