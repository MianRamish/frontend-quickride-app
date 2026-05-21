function Input({ label, type, name, placeholder, defaultValue, register, error, options, disabled }) {
  return (
    <div className="my-3">
      <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-400">{label}</label>
      {type === "select" ? (
        <select {...register(name)} defaultValue={defaultValue} className="input-box" disabled={disabled}>
          {options.map((option) => (
            <option key={option} value={option.toLowerCase()}>{option}</option>
          ))}
        </select>
      ) : (
        <input {...register(name)} type={type || "text"} placeholder={placeholder || label} className={`input-box ${disabled ? "cursor-not-allowed text-slate-400" : ""}`} disabled={disabled} defaultValue={defaultValue} />
      )}
      {error && <p className="mt-1 text-xs font-semibold text-red-500">{error.message}</p>}
    </div>
  );
}

export default Input;
