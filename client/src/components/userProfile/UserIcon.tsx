import type {CustomIconComponentProps} from "@ant-design/icons/es/components/Icon";
import Icon from '@ant-design/icons';
import userSvg from '../../assets/userProfile/user.svg';

const IconSvg = () => (
    <>
        <img
            src={userSvg}
            alt="avatar mac dinh"/>
    </>
);
export const UserIcon = (props: Partial<CustomIconComponentProps>) => (
    <Icon width={props.width} component={IconSvg} {...props} />
);