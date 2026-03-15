import { AppProvider } from "./context/AppContext";
import Chrome from "./layouts/Chrome";

export default function App() {
  return (
    <AppProvider>
      <Chrome />
    </AppProvider>
  );
}
