import NavBar from '../components/V1/layout/NavBar';

interface MainLayoutProps {
    children: React.ReactNode;
}

const MainLayout = ({children}: MainLayoutProps) => {
    return (
        <div className="min-h-screen bg-background">
            <NavBar/>
            <main className="flex items-center justify-center">
                {children}
            </main>
        </div>
    );
};

export default MainLayout;
