/** SPSA COBIL — Lentille Boréale : point d’entrée du cockpit, durablement centré sur l’action. */
import ErrorBoundary from "./components/ErrorBoundary";
import Home from "./pages/Home";

export default function App() {
  return <ErrorBoundary><Home /></ErrorBoundary>;
}
