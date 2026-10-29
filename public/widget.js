/*! Mirrorcart widget · MIT · https://github.com/PinnacleCryptNG/mirrorcart */
(function () {
  if (window.__mirrorcart) return;
  var me = document.currentScript || document.querySelector('script[src*="widget.js"]');
  var base = me ? new URL(me.src, location.href).origin : location.origin;
  var store = (me && me.getAttribute("data-store")) || "aurel-demo";
  var frame, wrap, current = [];

  function parse(el) {
    try { return JSON.parse(el.getAttribute("data-items") || "[]"); } catch (e) { return []; }
  }
  function collect() {
    var all = [];
    document.querySelectorAll("[data-mirrorcart-tryon]").forEach(function (b) { all = all.concat(parse(b)); });
    return all;
  }
  function css(el, s) { for (var k in s) el.style[k] = s[k]; return el; }

  function open(items) {
    current = items && items.length ? items : collect();
    close();
    wrap = css(document.createElement("div"), { position: "fixed", inset: "0", zIndex: "2147483646", background: "transparent" });
    frame = document.createElement("iframe");
    frame.src = base + "/embed?store=" + encodeURIComponent(store) + "&items=" + encodeURIComponent(JSON.stringify(current)) + "&origin=" + encodeURIComponent(location.origin);
    frame.title = "Mirrorcart virtual try-on";
    frame.allow = "camera";
    css(frame, { width: "100%", height: "100%", border: "0", background: "transparent", colorScheme: "normal" });
    wrap.appendChild(frame);
    document.body.appendChild(wrap);
    document.documentElement.style.overflow = "hidden";
  }
  function close() {
    if (wrap) wrap.remove();
    wrap = frame = null;
    document.documentElement.style.overflow = "";
  }

  window.addEventListener("message", function (e) {
    if (e.origin !== base || !e.data || typeof e.data.type !== "string") return;
    var t = e.data.type;
    if (t === "mirrorcart:close") close();
    if (t === "mirrorcart:checkout" || t === "mirrorcart:remove-item" || t === "mirrorcart:swap-item") {
      document.dispatchEvent(new CustomEvent(t, { detail: e.data.payload }));
      if (t === "mirrorcart:checkout") close();
    }
  });

  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-mirrorcart-tryon]");
    if (b) { e.preventDefault(); open(parse(b)); }
  });

  function fab() {
    if (document.querySelector("[data-mirrorcart-fab]")) return;
    var b = document.createElement("button");
    b.setAttribute("data-mirrorcart-fab", "");
    b.type = "button";
    b.setAttribute("aria-label", "See it on me with Mirrorcart");
    b.innerHTML = '<span style="display:inline-grid;place-items:center;width:22px;height:22px;border-radius:50%;background:linear-gradient(135deg,#fff,#9be7ff);color:#101014;font:800 12px system-ui;margin-right:8px">M</span>See it on me';
    css(b, { position: "fixed", right: "20px", bottom: "20px", zIndex: "2147483645", display: "flex", alignItems: "center", padding: "12px 18px 12px 12px", borderRadius: "999px", border: "2px solid #e8c46c", background: "#0f4434", color: "#fff", font: "600 15px system-ui,sans-serif", cursor: "pointer", boxShadow: "0 8px 30px rgba(0,0,0,.25)" });
    b.onclick = function () { open(); };
    document.body.appendChild(b);
  }

  window.__mirrorcart = { open: open, close: close, store: store };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fab); else fab();
})();
