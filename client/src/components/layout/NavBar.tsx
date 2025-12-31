import {NavLink} from 'react-router-dom';

const NavBar = () => {
    const navLinkClass = ({isActive}: { isActive: boolean }) =>
        `px-6 py-3 rounded-lg font-semibold text-lg transition-all duration-300 ${
            isActive
                ? 'bg-blue-600 text-white shadow-lg transform scale-120'
                : 'bg-white text-blue-600 hover:bg-amber-50 hover:shadow-md'
        }`;

    return (
        <div
            className="w-full h-[20vh] bg-gradient-to-r from-blue-300 to-blue-500 flex flex-col justify-center items-center shadow-md">
            <h1 className="text-3xl font-bold text-white mb-8">FILE SHARING By Nam</h1>
            <div className="flex gap-8">
                <NavLink to="/upload" className={navLinkClass}>
                    Upload And Send
                </NavLink>
                <NavLink to="/my-files" className={navLinkClass}>
                    My File
                </NavLink>
            </div>
        </div>
    );
};

export default NavBar;