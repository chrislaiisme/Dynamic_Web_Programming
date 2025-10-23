function newtab(url) {window.open(url, "_blank");}

const popup1    = document.getElementById("popup1");
const popup2    = document.getElementById("popup2");
const closeBtn1 = document.getElementById("closePopupBtn1");
const closeBtn2 = document.getElementById("closePopupBtn2");
const overlay   = document.getElementById("overlay");
const openBtn   = document.getElementById("openPopupBtn");
const ciallo    = document.getElementById("ciallo");
const startBtn  = document.getElementById("startBtn");
const boxes     = document.querySelectorAll(".box");

window.addEventListener("load", () => {
  setTimeout(() => {window.scrollTo(0, 0); showPopup(popup1, false);}, 10);
});
openBtn.addEventListener("click", () => {
  ciallo.muted = false; ciallo.play(); showPopup(popup2, true);
});

closeBtn1.addEventListener("click", () => closePopup(popup1));
closeBtn2.addEventListener("click", () => closePopup(popup2));

function showPopup(popup, scrollable) {
  overlay.classList.remove("hidden");
  popup.classList.remove("hidden");

  const content = popup.querySelector(".popup-content");

  if(scrollable) content.style.overflowY = "auto";
  else content.style.overflowY = "hidden";
}
function closePopup(popup) {
  popup.classList.add("hidden"); overlay.classList.add("hidden");
}

function updateCurrentTime() {
  const nowTime = document.getElementById("currentTime");
  const S = nowTime.innerText, num = (parseFloat(S.slice(0, S.length))+0.1).toFixed(1);
  const ad = document.getElementById("ad");
  const closeBtn = document.getElementById("closeAdBtn1");

	nowTime.innerText = String(num) + "s";
  if(num == 3) ad.style.display = "block";
  if(num >= 3) closeBtn.addEventListener("click", () => {ad.style.display = "none";});
}
setInterval(updateCurrentTime, 100);

startBtn.addEventListener("click", () => {
  document.body.style.overflowY = "auto";
  boxes.forEach((box, index) => {
    setTimeout(() => {box.classList.add("active");}, index * 300);
  });

  startBtn.classList.add("no-hover");
  startBtn.classList.add("fade-out");
  startBtn.addEventListener("animationend", () => {startBtn.style.display = "none";}, {once: true});
});

function handleScrollFade() {
  const scrollY = window.scrollY || window.pageYOffset;

  const left1 = document.getElementById("left1");
  const right1 = document.getElementById("right1");
  const left2 = document.getElementById("left2");
  const right2 = document.getElementById("right2");

  if(scrollY < 300) left1.classList.remove("active");
  if(scrollY > 300) left1.classList.add("active");
  if(scrollY < 200) right1.classList.remove("active");
  if(scrollY > 200) right1.classList.add("active");
  if(scrollY < 800) left2.classList.remove("active");
  if(scrollY > 800) left2.classList.add("active");
  if(scrollY < 600) right2.classList.remove("active");
  if(scrollY > 600) right2.classList.add("active");
}

window.addEventListener("scroll", handleScrollFade);
document.addEventListener("DOMContentLoaded", () => {
  const title = "Ciallo～(∠・ω< )⌒★ㅤㅤ";
  let idx = 0;

  setInterval(() => {
    document.title = title.substring(idx) + title.substring(0, idx);
    idx = (idx+1) % title.length;
  }, 300);
});