import type {CustomIconComponentProps} from "@ant-design/icons/es/components/Icon";
import Icon from '@ant-design/icons';

const IconSvg = () => (
    <>
        <img
            src="src/assets/userProfile/user.svg"
            alt="image"/>
    </>
);
export const UserIcon = (props: Partial<CustomIconComponentProps>) => (
    <Icon width={props.width} component={IconSvg} {...props} />
);