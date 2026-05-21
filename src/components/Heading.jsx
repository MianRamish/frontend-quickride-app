function Heading({ title, eyebrow = "QuickRide" }) {
  return (
    <div className="mb-8">
      <p className="mini-label">{eyebrow}</p>
      <h1 className="mt-2 text-4xl font-black leading-tight tracking-tight text-slate-950">{title}</h1>
    </div>
  );
}

export default Heading;
