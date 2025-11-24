export function showToast(msg, ms = 1500) {
  const prev = document.getElementById("ll-toast");
  if (prev) prev.remove();

  const div = document.createElement("div");
  div.id = "ll-toast";
  div.textContent = msg;

  Object.assign(div.style, {
    position: "fixed",
    top: "50%", left: "50%",
    transform: "translate(-50%,-50%) scale(0.8)",
    background: "rgba(0,0,0,.85)",
    color: "#fff",
    padding: "1rem 1.6rem",
    borderRadius: "12px",
    zIndex: "99999",
    fontWeight: "600",
    fontSize: "1.2rem",
    boxShadow: "0 8px 25px rgba(0,0,0,0.3)",
    opacity: "0",
    transition: "opacity .35s, transform .35s"
  });

  document.body.appendChild(div);
  setTimeout(() => { div.style.opacity = "1"; div.style.transform = "translate(-50%,-50%) scale(1)"; }, 10);
  setTimeout(() => { div.style.opacity = "0"; div.style.transform = "scale(0.8)"; setTimeout(() => div.remove(), 350); }, ms);
}
