function App() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#0b1220",
      color: "white",
      padding: "40px",
      fontFamily: "Arial"
    }}>
      <h1>🇯🇵 Japan Fare Radar</h1>

      <p>
        Första versionen kör nu lokalt på din dator.
      </p>

      <button
        style={{
          background: "#dc2626",
          color: "white",
          border: "none",
          padding: "12px 20px",
          cursor: "pointer",
          fontSize: "16px"
        }}
      >
        Sök livepriser
      </button>

      <div style={{
        marginTop: "30px",
        padding: "20px",
        background: "#111827"
      }}>
        <h2>Status</h2>
        <p>✅ React fungerar</p>
        <p>✅ Vite fungerar</p>
        <p>✅ Lucide fungerar</p>
        <p>⏳ Flyg-API ej inkopplat ännu</p>
      </div>
    </div>
  );
}

export default App;