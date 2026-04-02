document.addEventListener("DOMContentLoaded", function () {
    const mRange = document.getElementById("ipm-m-range");
    const t0Range = document.getElementById("ipm-t0-range");
    const muRange = document.getElementById("ipm-mu-range");
    const epsRange = document.getElementById("ipm-eps-range");

    const paramsDisplay = document.getElementById("ipm-params-display");
    const metricsBox = document.getElementById("ipmMetricsBox");
    const canvas = document.getElementById("ipmCanvas");
    const runBtn = document.getElementById("runIpmBtn");
    const resetBtn = document.getElementById("resetIpmBtn");

    if (!mRange || !t0Range || !muRange || !epsRange || !canvas || !runBtn || !resetBtn) {
        return;
    }

    const ctx = canvas.getContext("2d");

    function drawAxes(points) {
        const width = canvas.width;
        const height = canvas.height;
        const pad = 45;

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = "#334155";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(pad, height - pad);
        ctx.lineTo(width - pad, height - pad);
        ctx.moveTo(pad, height - pad);
        ctx.lineTo(pad, pad);
        ctx.stroke();

        if (!points.length) {
            return;
        }

        const maxK = points[points.length - 1].k;
        const maxGap = Math.max.apply(null, points.map((p) => p.gap));
        const minGap = Math.min.apply(null, points.map((p) => p.gap));
        const rangeGap = Math.max(maxGap - minGap, 1e-9);

        function toCanvas(k, gap) {
            const x = pad + (maxK === 0 ? 0 : (k / maxK) * (width - 2 * pad));
            const y = height - pad - ((gap - minGap) / rangeGap) * (height - 2 * pad);
            return [x, y];
        }

        ctx.strokeStyle = "#2563eb";
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < points.length; i++) {
            const p = toCanvas(points[i].k, points[i].gap);
            if (i === 0) {
                ctx.moveTo(p[0], p[1]);
            } else {
                ctx.lineTo(p[0], p[1]);
            }
        }
        ctx.stroke();

        ctx.fillStyle = "#2563eb";
        for (let i = 0; i < points.length; i++) {
            const p = toCanvas(points[i].k, points[i].gap);
            ctx.beginPath();
            ctx.arc(p[0], p[1], 3, 0, 2 * Math.PI);
            ctx.fill();
        }

        ctx.fillStyle = "#334155";
        ctx.font = "12px sans-serif";
        ctx.fillText("outer iteration", width / 2 - 35, height - 10);
        ctx.save();
        ctx.translate(14, height / 2 + 24);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText("gap m/t", 0, 0);
        ctx.restore();
    }

    function simulate() {
        const m = parseInt(mRange.value, 10);
        const t0 = parseFloat(t0Range.value);
        const mu = parseFloat(muRange.value);
        const eps = parseFloat(epsRange.value);

        let t = t0;
        let k = 0;
        const points = [];
        let log = "k | t        | gap = m/t\n";
        log += "--+----------+-----------\n";

        while (k < 200) {
            const gap = m / t;
            points.push({ k, t, gap });
            log += `${String(k).padEnd(2)}| ${t.toFixed(4).padEnd(8)} | ${gap.toFixed(6)}\n`;
            if (gap <= eps) {
                break;
            }
            t = mu * t;
            k += 1;
        }

        paramsDisplay.textContent = `m = ${m}, t0 = ${t0.toFixed(2)}, mu = ${mu.toFixed(2)}, epsilon = ${eps.toFixed(4)}`;
        metricsBox.textContent = log + (points[points.length - 1].gap <= eps
            ? "\nReached tolerance: gap <= epsilon."
            : "\nStopped at iteration cap before reaching tolerance.");
        drawAxes(points);
    }

    function resetView() {
        paramsDisplay.textContent = "Adjust parameters and run simulation.";
        metricsBox.textContent = "Run the demo to populate metrics.";
        drawAxes([]);
    }

    runBtn.addEventListener("click", simulate);
    resetBtn.addEventListener("click", resetView);

    resetView();
});
