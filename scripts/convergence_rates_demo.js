document.addEventListener("DOMContentLoaded", function () {
    const stepsRange = document.getElementById("cr-steps-range");
    const kappaRange = document.getElementById("cr-kappa-range");
    const startGapRange = document.getElementById("cr-start-gap-range");

    const paramsDisplay = document.getElementById("cr-params-display");
    const metricsBox = document.getElementById("convergenceRatesMetrics");
    const canvas = document.getElementById("convergenceRatesCanvas");
    const runBtn = document.getElementById("runConvergenceRatesBtn");
    const resetBtn = document.getElementById("resetConvergenceRatesBtn");

    if (!stepsRange || !kappaRange || !startGapRange || !canvas || !runBtn || !resetBtn) {
        return;
    }

    const ctx = canvas.getContext("2d");

    function buildSeries(steps, kappa, startGap) {
        const qLinear = (kappa - 1) / (kappa + 1);
        const subgrad = [];
        const gd = [];
        const accel = [];
        const linear = [];

        for (let k = 0; k <= steps; k++) {
            const kk = Math.max(1, k);
            subgrad.push({ x: k, y: startGap / Math.sqrt(kk) });
            gd.push({ x: k, y: startGap / kk });
            accel.push({ x: k, y: startGap / (kk * kk) });
            linear.push({ x: k, y: startGap * Math.pow(qLinear, k) });
        }

        return { subgrad, gd, accel, linear, qLinear };
    }

    function draw(series) {
        const w = canvas.width;
        const h = canvas.height;
        const pad = 36;

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, w, h);

        ctx.strokeStyle = "#cbd5e1";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(pad, h - pad);
        ctx.lineTo(w - pad, h - pad);
        ctx.moveTo(pad, h - pad);
        ctx.lineTo(pad, pad);
        ctx.stroke();

        const all = series.subgrad.concat(series.gd, series.accel, series.linear);
        const yLogs = all.map((p) => Math.log10(Math.max(p.y, 1e-14)));
        const yMin = Math.min(...yLogs);
        const yMax = Math.max(...yLogs, -0.000001);

        const maxX = series.subgrad[series.subgrad.length - 1].x;

        function tx(x) {
            return pad + (x / Math.max(1, maxX)) * (w - 2 * pad);
        }

        function ty(y) {
            const yLog = Math.log10(Math.max(y, 1e-14));
            return h - pad - ((yLog - yMin) / Math.max(1e-9, yMax - yMin)) * (h - 2 * pad);
        }

        function drawSeries(arr, color) {
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            arr.forEach((p, i) => {
                const x = tx(p.x);
                const y = ty(p.y);
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });
            ctx.stroke();
        }

        drawSeries(series.subgrad, "#7c3aed");
        drawSeries(series.gd, "#2563eb");
        drawSeries(series.accel, "#16a34a");
        drawSeries(series.linear, "#dc2626");

        const legend = [
            ["Subgradient O(1/sqrt(k))", "#7c3aed"],
            ["GD O(1/k)", "#2563eb"],
            ["Accelerated O(1/k^2)", "#16a34a"],
            ["Linear O(rho^k)", "#dc2626"]
        ];
        legend.forEach((row, i) => {
            const y = pad + 10 + i * 18;
            ctx.fillStyle = row[1];
            ctx.fillRect(w - 180, y, 12, 3);
            ctx.fillStyle = "#334155";
            ctx.font = "11px sans-serif";
            ctx.fillText(row[0], w - 162, y + 4);
        });

        ctx.fillStyle = "#334155";
        ctx.font = "12px sans-serif";
        ctx.fillText("log10(gap)", pad + 4, pad - 8);
        ctx.fillText("iterations", w - pad - 56, h - pad + 20);
    }

    function run() {
        const steps = parseInt(stepsRange.value, 10);
        const kappa = parseFloat(kappaRange.value);
        const startGap = parseFloat(startGapRange.value);

        const series = buildSeries(steps, kappa, startGap);
        draw(series);

        const idx = steps;
        const gSub = series.subgrad[idx].y;
        const gGd = series.gd[idx].y;
        const gAcc = series.accel[idx].y;
        const gLin = series.linear[idx].y;

        let text = "Convergence Rate Comparator\n";
        text += "--------------------------\n";
        text += `iterations = ${steps}, kappa = ${kappa.toFixed(1)}, initial gap = ${startGap.toFixed(2)}\n`;
        text += `linear factor rho = ${(series.qLinear).toFixed(5)}\n\n`;
        text += `Subgradient gap: ${gSub.toExponential(4)}\n`;
        text += `GD gap: ${gGd.toExponential(4)}\n`;
        text += `Accelerated gap: ${gAcc.toExponential(4)}\n`;
        text += `Linear gap: ${gLin.toExponential(4)}\n`;

        metricsBox.textContent = text;
    }

    function updateLabel() {
        paramsDisplay.textContent = `iterations=${stepsRange.value}, kappa=${parseFloat(kappaRange.value).toFixed(1)}, initial gap=${parseFloat(startGapRange.value).toFixed(1)}`;
    }

    function reset() {
        updateLabel();
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        metricsBox.textContent = "Run the comparator to populate metrics.";
    }

    stepsRange.addEventListener("input", updateLabel);
    kappaRange.addEventListener("input", updateLabel);
    startGapRange.addEventListener("input", updateLabel);
    runBtn.addEventListener("click", run);
    resetBtn.addEventListener("click", reset);

    reset();
});
