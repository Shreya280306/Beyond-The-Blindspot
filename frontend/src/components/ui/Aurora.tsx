/* Ambient background: soft emerald aurora blobs + grid.
   Sits behind page content, pointer-events-none. */
export function Aurora({ dense = false }: { dense?: boolean }) {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-grid mask-fade-b opacity-60" />
      <div
        className="absolute -top-40 left-1/4 h-[36rem] w-[36rem] rounded-full blur-[120px] animate-float-slow"
        style={{ background: "radial-gradient(circle,rgba(16,185,129,0.18),transparent 60%)" }}
      />
      <div
        className="absolute top-1/3 -right-32 h-[30rem] w-[30rem] rounded-full blur-[120px] animate-float-slow"
        style={{ background: "radial-gradient(circle,rgba(20,120,90,0.16),transparent 60%)", animationDelay: "3s" }}
      />
      {dense && (
        <div
          className="absolute bottom-0 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full blur-[130px] animate-float-slow"
          style={{ background: "radial-gradient(circle,rgba(52,211,153,0.12),transparent 60%)", animationDelay: "6s" }}
        />
      )}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_40%,rgba(8,9,10,0.9))]" />
    </div>
  );
}
