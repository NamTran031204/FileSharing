import {Select} from 'antd';
import {useTranslation} from 'react-i18next';
import {switchLanguage} from '../../../i18n';
import type {Lang} from '../../../utils/lang.util';

const LanguageSwitcher = () => {
  const {i18n, t} = useTranslation();

  return (
    <Select
      size="small"
      value={i18n.language as Lang}
      aria-label={t('language')}
      onChange={(lang: Lang) => void switchLanguage(lang)}
      options={[
        {value: 'vi', label: 'VI'},
        {value: 'en', label: 'EN'},
      ]}
    />
  );
};

export default LanguageSwitcher;
