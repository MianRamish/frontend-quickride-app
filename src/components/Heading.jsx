<<<<<<< HEAD
function Heading({ title, eyebrow = "QuickRide", description }) {
  return (
    <div className="mb-6">
      <p className="mini-label">{eyebrow}</p>
      <h1 className="mt-2 text-[clamp(1.9rem,9vw,2.6rem)] font-black leading-[1.02] tracking-[-0.04em] text-slate-950">{title}</h1>
      {description ? <p className="mt-2 max-w-md text-sm font-semibold leading-6 text-slate-500">{description}</p> : null}
=======
function Heading({ title, eyebrow = "QuickRide" }) {
  return (
    <div className="mb-8">
      <p className="mini-label">{eyebrow}</p>
      <h1 className="mt-2 text-4xl font-black leading-tight tracking-tight text-slate-950">{title}</h1>
>>>>>>> 26cceed184f29a0805f2d5ed809f7622d67499e7
    </div>
  );
}

export default Heading;
