import { MfaSetupPanel } from "./MfaSetupPanel";

export default function DashboardSecuritePage() {
  return (
    <main className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Sécurité du compte</h1>
      <MfaSetupPanel />
    </main>
  );
}
