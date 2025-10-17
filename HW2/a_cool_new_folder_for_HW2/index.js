function newtab(url) {window.open(url, "_blank");} // Feature 1
// --- 元素選取 ---
const popup = document.getElementById("popup");
const overlay = document.getElementById("overlay");
const openBtn = document.getElementById("openPopupBtn");
const closeBtn = document.getElementById("closePopupBtn");

// --- 功能 1: 頁面載入後自動顯示 popup（不可捲動）---
window.addEventListener("load", () => {
  showPopup(false); // false => 不可捲動版本
});

// --- 功能 2: 點按鈕顯示 popup（可捲動）---
openBtn.addEventListener("click", () => {
  showPopup(true); // true => 可捲動版本
});

// --- 關閉按鈕 ---
closeBtn.addEventListener("click", closePopup);

// --- 函數 ---
function showPopup(scrollable) {
  overlay.classList.remove("hidden");
  popup.classList.remove("hidden");

  const content = popup.querySelector(".popup-content");

  if (scrollable) {
    // 可捲動版本
    content.style.overflowY = "auto";
    document.body.style.overflow = "auto";
  } else {
    // 不可捲動版本
    content.style.overflowY = "hidden";
    document.body.style.overflow = "hidden";
  }
}

function closePopup() {
  overlay.classList.add("hidden");
  popup.classList.add("hidden");
  document.body.style.overflow = "auto";
}