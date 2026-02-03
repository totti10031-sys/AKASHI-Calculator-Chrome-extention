(function () {

  const parseTime = (str) => {
    if (!str || !str.includes(":")) return 0;
    const [h, m] = str.split(":").map(Number);
    return h * 60 + m;
  };

  const formatHM = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}時間${m.toString().padStart(2, "0")}分`;
  };

  let timer = null;

  function scheduleCalculate() {
    if (timer) return;
    timer = setTimeout(() => {
      timer = null;
      calculate();
    }, 500); // ★ 0.5秒に1回だけ
  }

  function calculate() {
    const rows = document.querySelectorAll("table tbody tr");
    if (rows.length === 0) return;

    const oldBar = document.getElementById("akashi-summary-bar");
    if (oldBar) oldBar.remove();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let actualMinutes = 0;
    let workDays = 0;
    let futureWorkDays = 0;

    rows.forEach(row => {
      const cells = row.querySelectorAll("td");
      if (cells.length < 7) return;

      const dateText = cells[0].innerText.trim();
      const status = cells[3].innerText.trim();
      const weekdayTime = cells[4].innerText.trim();
      const holidayTime = cells[6].innerText.trim();

      if (status !== "勤務") return;

      workDays++;

      const match = dateText.match(/(\d{2})\/(\d{2})/);
      if (!match) return;

      const date = new Date(
        today.getFullYear(),
        Number(match[1]) - 1,
        Number(match[2])
      );

      if (date <= today) {
        actualMinutes += parseTime(weekdayTime);
        actualMinutes += parseTime(holidayTime);
      } else {
        futureWorkDays++;
      }
    });

    const requiredMinutes = workDays * 8 * 60;
    const expectedMinutes = actualMinutes + futureWorkDays * 8 * 60;
    const diffMinutes = expectedMinutes - requiredMinutes;

    const bar = document.createElement("div");
    bar.id = "akashi-summary-bar";
    bar.style.position = "sticky";
    bar.style.top = "0";
    bar.style.background = "#0b5ed7";
    bar.style.color = "#fff";
    bar.style.padding = "10px";
    bar.style.zIndex = "9999";
    bar.innerHTML = `
      <strong>月末見込み過不足（未来日は8時間換算）</strong><br>
      所定労働時間：${formatHM(requiredMinutes)}<br>
      月末見込み労働時間：${formatHM(expectedMinutes)}<br>
      過不足：${diffMinutes >= 0 ? "+" : "-"}${formatHM(Math.abs(diffMinutes))}
    `;

    document.body.prepend(bar);
  }

  // 初回実行
  scheduleCalculate();

  // DOM変化を監視（安全版）
  const observer = new MutationObserver(() => {
    scheduleCalculate();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

})();
