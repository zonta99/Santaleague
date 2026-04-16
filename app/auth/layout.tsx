const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="relative h-full min-h-screen flex items-center justify-center overflow-hidden bg-background">
      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)`,
          backgroundSize: "72px 72px",
        }}
      />
      {/* Green ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] rounded-full bg-primary/5 blur-[100px] pointer-events-none" />
      <div className="relative z-10">{children}</div>
    </div>
  );
};

export default AuthLayout;
