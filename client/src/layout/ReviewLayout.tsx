import AppHeader from '../components/AppHeader';
import AppSidebar from '../components/AppSidebar';

interface ReviewLayoutProps {
  children: React.ReactNode;
}

const ReviewLayout = ({ children }: ReviewLayoutProps) => {
  return (
    <div className="bg-[#fbf8ff] text-[#0d1154] min-h-screen overflow-hidden flex flex-col">
      {/* TopNavBar - Fixed Header */}
      <AppHeader />

      {/* Main Workspace Container */}
      <main className="flex flex-1 pt-16 h-screen overflow-hidden">
        {/* SideNavBar (Left) */}
        <AppSidebar />

        {/* Tool & Canvas Area */}
        <section className="flex-1 flex flex-col bg-[#fbf8ff] overflow-hidden">
          {children}
        </section>
      </main>
    </div>
  );
};

export default ReviewLayout;

