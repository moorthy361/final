import { useEffect } from "react";

function App() {
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/health`)
      .then((response) => response.json())
      .then((data) => {
        console.log("AquaSentinel Backend Connected:", data);
      })
      .catch((error) => {
        console.error("Backend Connection Failed:", error);
      });
  }, []);

  return <div>AquaSentinel AI</div>;
}

export default App;
