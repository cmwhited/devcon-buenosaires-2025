export function Footer() {
  return (
    <footer className="flex w-full flex-col">
      <div
        className="flex w-full items-center justify-center"
        style={{
          height: "66px",
          backgroundColor: "#2D2D2D",
          border: "2px solid #333333",
          boxSizing: "border-box",
        }}
      >
        <p className="font-mono text-[16px] uppercase" style={{ color: "#F5F5DC" }}>
          Pit Stop was Built with 🩶 in Buenos Aires by Chris, Miguel, Matias, Tomás and Jamẽs
        </p>
      </div>
    </footer>
  )
}
