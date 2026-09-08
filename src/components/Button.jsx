import { Link } from "react-router-dom";
import Spinner from "./Spinner";

function Button({ path, title, icon, type, classes = "", fun, loading, loadingMessage, disabled, variant = "primary" }) {
  const base = variant === "secondary" ? "secondary-btn" : variant === "danger" ? "danger-btn" : "primary-btn";

  if (type === "link") {
    return (
      <Link to={path} className={`flex w-full items-center justify-center gap-2 ${base} ${classes}`}>
        {title} {icon}
      </Link>
    );
  }

  return (
    <button
      type={type || "button"}
      className={`flex w-full items-center justify-center gap-2 ${base} ${classes}`}
      onClick={fun}
      disabled={loading || disabled}
    >
      {loading ? <span className="flex items-center gap-2"><Spinner />{loadingMessage || "Please wait"}</span> : title}
    </button>
  );
}

export default Button;
