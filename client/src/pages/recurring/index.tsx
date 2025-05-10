import RecurringList from "@/components/recurring/RecurringList";
import MainLayout from "@/components/layout/MainLayout";

export default function RecurringIndex() {
  return (
    <MainLayout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <RecurringList />
        </div>
      </div>
    </MainLayout>
  );
}
