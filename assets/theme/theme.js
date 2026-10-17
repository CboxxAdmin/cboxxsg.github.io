/* Light/dark switch shared by every Seaport page (same saved choice as the main pages). */
(function(){
  var r=document.documentElement,KEY="seaport-theme";
  function cur(){return r.getAttribute("data-theme")||(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light")}
  function apply(t){r.setAttribute("data-theme",t)}
  try{var s=localStorage.getItem(KEY);if(s==="light"||s==="dark")apply(s);else apply(cur())}catch(e){apply(cur())}
  function mount(){
    if(document.getElementById("spTheme"))return;
    var b=document.createElement("button");b.type="button";b.id="spTheme";b.className="sp-theme";
    b.setAttribute("aria-label","Switch between light and dark mode");
    function label(){b.textContent=cur()==="dark"?"[light]":"[dark]"}
    label();
    b.addEventListener("click",function(){var n=cur()==="dark"?"light":"dark";apply(n);try{localStorage.setItem(KEY,n)}catch(e){}label()});
    document.body.appendChild(b);
  }
  if(document.body)mount();else document.addEventListener("DOMContentLoaded",mount);
})();
