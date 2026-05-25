import AppHeader from '../components/core/layout/AppHeader.tsx';
import AppSidebar from '../components/core/layout/AppSidebar.tsx';

interface ReviewLayoutProps {
  children: React.ReactNode;
}

const CommonLayout = ({ children }: ReviewLayoutProps) => {
  return (
    <div className="bg-background text-primary-dark h-screen overflow-hidden flex flex-col">
      {/* TopNavBar - Fixed Header */}
      <AppHeader />

      {/* Main Workspace Container */}
      <main className="flex flex-1 min-h-0 pt-16 overflow-hidden">
        {/* SideNavBar (Left) */}
        <AppSidebar />

        {/* Tool & Canvas Area */}
        <section className="flex-1 flex flex-col bg-background overflow-hidden">
          {children}
        </section>
      </main>
    </div>
  );
};

export default CommonLayout;

