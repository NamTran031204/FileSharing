import AppHeader from '../components/core/layout/AppHeader.tsx';
import AppSidebar from '../components/core/layout/AppSidebar.tsx';

interface ReviewLayoutProps {
  children: React.ReactNode;
  /** true = AppSidebar hien icon-only, hover de mo rong de len content. Mac dinh false giu nguyen UI hien tai. */
  sidebarCollapsed?: boolean;
}

const CommonLayout = ({ children, sidebarCollapsed = false }: ReviewLayoutProps) => {
  return (
    <div className="bg-background text-primary-dark h-screen overflow-hidden flex flex-col">
      {/* TopNavBar - Fixed Header */}
      <AppHeader />

      {/* Main Workspace Container */}
      <main className="flex flex-1 min-h-0 pt-16 overflow-hidden">
        {/* SideNavBar (Left) */}
        <AppSidebar collapsed={sidebarCollapsed} />

        {/* Tool & Canvas Area */}
        <section className="flex-1 flex flex-col bg-background overflow-hidden">
          {children}
        </section>
      </main>
    </div>
  );
};

export default CommonLayout;

