import { Canvas } from "./canvas";
import { ThemeProvider } from "./hooks/useTheme";
import "./App.css";

function App() {
  return (
    <ThemeProvider>
      <div className="w-full h-screen overflow-hidden">
        <Canvas />
      </div>
    </ThemeProvider>
  );
}

export default App;
