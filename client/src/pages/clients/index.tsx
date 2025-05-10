import ClientsList from "@/components/clients/ClientsList";
import MainLayout from "@/components/layout/MainLayout";

export default function ClientsIndex() {
  return (
    <MainLayout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <ClientsList />
        </div>
      </div>
    </MainLayout>
  );
}
