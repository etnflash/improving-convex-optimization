document.addEventListener("DOMContentLoaded", function () {
    const summary = document.getElementById("demo-count-summary");
    if (!summary) {
        return;
    }

    const demoBadges = document.querySelectorAll(".topic-card .status-badge.status-demo");
    const count = demoBadges.length;

    summary.textContent = `Interactive demos: ${count} module${count === 1 ? "" : "s"}.`;
});
