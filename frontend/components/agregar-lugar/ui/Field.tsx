export default function Field({
  label, sublabel, required, hasError, errorText, children,
}: {
  label: string
  sublabel?: string
  required: boolean
  hasError?: boolean
  errorText?: string
  children: React.ReactNode
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ fontSize: 13, fontWeight: 500, color: hasError ? "#e53e3e" : "#1b1b19" }}>
        {label}{" "}
        {required
          ? <span style={{ fontSize: 12, color: "#e53e3e", fontWeight: 400 }}>(obligatorio)</span>
          : <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 400 }}>(opcional)</span>
        }
        {sublabel && (
          <div style={{ fontSize: 11, fontWeight: 400, color: "#7a7669", marginTop: 2 }}>{sublabel}</div>
        )}
      </div>
      {children}
      {hasError && errorText && (
        <p style={{ fontSize: 12, color: "#e53e3e", margin: "2px 0 0" }}>{errorText}</p>
      )}
    </div>
  )
}
