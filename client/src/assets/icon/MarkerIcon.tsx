import type { CustomIconComponentProps } from '@ant-design/icons/es/components/Icon';
import Icon from '@ant-design/icons';

const Svg = () => (
  <svg
    width="1em"
    height="1em"
    viewBox="0 0 15 15"
    version="1.1"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fill="currentColor"
      d="M7.5,0C5.0676,0,2.2297,1.4865,2.2297,5.2703
	C2.2297,7.8378,6.2838,13.5135,7.5,15c1.0811-1.4865,5.2703-7.027,5.2703-9.7297C12.7703,1.4865,9.9324,0,7.5,0z"
    />
  </svg>
);

export const MarkerIcon = (props: Partial<CustomIconComponentProps>) => (
  <Icon component={Svg} {...props} />
);
