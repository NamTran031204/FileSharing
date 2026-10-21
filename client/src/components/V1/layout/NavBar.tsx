import {NavLink} from 'react-router-dom';
import {CloudUploadOutlined, DeleteOutlined, FolderOutlined, UserOutlined} from '@ant-design/icons';
import i18n from '../../../i18n';

const NavBar = () => {
    const navLinkClass = ({isActive}: { isActive: boolean }) =>
        `flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-base transition-all duration-300 ${
            isActive
                ? 'bg-card text-primary shadow-lg scale-105'
                : 'bg-primary/10 text-primary-foreground hover:bg-card/80 hover:shadow-md'
        }`;

    return (
        <header className="w-full bg-gradient-to-r from-primary to-[hsl(var(--info))] shadow-lg">
            <div className="container mx-auto px-4 py-6">
                <div className="flex flex-col items-center gap-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-card rounded-xl flex items-center justify-center shadow-md">
                            <CloudUploadOutlined className="text-2xl text-primary"/>
                        </div>
                        <h1 className="text-3xl font-bold text-primary-foreground tracking-tight">
                            {i18n.t('file:navBar.fileSharing')}
                        </h1>
                    </div>

                    <nav className="flex gap-4">
                        <NavLink to="/upload" className={navLinkClass}>
                            <CloudUploadOutlined className="text-lg"/>
                            {i18n.t('file:navBar.uploadShare')}
                        </NavLink>
                        <NavLink to="/my-files" className={navLinkClass}>
                            <FolderOutlined className="text-lg"/>
                            {i18n.t('file:navBar.myFiles')}
                        </NavLink>
                        <NavLink to="/profile" className={navLinkClass}>
                            <UserOutlined className="text-lg"/>
                            {i18n.t('file:navBar.profile')}
                        </NavLink>
                        <NavLink to="/trash" className={navLinkClass}>
                            <DeleteOutlined className="text-lg"/>
                            {i18n.t('file:navBar.trash')}
                        </NavLink>
                    </nav>
                </div>
            </div>
        </header>
    );
};

export default NavBar;
