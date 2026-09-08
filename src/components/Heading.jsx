function Heading({ title, eyebrow = "QuickRide", description }) {
  return (
    <div className="mb-6">
      <p className="mini-label">{eyebrow}</p>
      <h1 className="mt-2 text-[clamp(1.9rem,9vw,2.6rem)] font-black leading-[1.02] tracking-[-0.04em] text-slate-950">{title}</h1>
      {description ? <p className="mt-2 max-w-md text-sm font-semibold leading-6 text-slate-500">{description}</p> : null}
    </div>
  );
}

export default Heading;
