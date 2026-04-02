document.addEventListener("DOMContentLoaded", function () {
    const conflictRange = document.getElementById("os-conflict-range");
    const stepsRange = document.getElementById("os-steps-range");
    const scaleRange = document.getElementById("os-scale-range");

    const paramsDisplay = document.getElementById("os-params-display");
    const metricsBox = document.getElementById("operatorSplittingMetrics");
    const canvas = document.getElementById("operatorSplittingCanvas");
    const runBtn = document.getElementById("runOperatorSplittingBtn");
    const resetBtn = document.getElementById("resetOperatorSplittingBtn");

    if (!conflictRange || !stepsRange || !scaleRange || !canvas || !runBtn || !resetBtn) {
        return;
    }

    const ctx = canvas.getContext("2d");

    function buildSeries(conflict, steps, scale) {
        const fb = [];
        const dr = [];
        const base = [];

        const qFb = Math.min(0.98, 0.62 + 0.3 * conflict);
        const qDr = Math.min(0.99, 0.54 + 0.22 * conflict);
        const qBase = Math.min(0.995, 0.76 + 0.2 * conflict);

        for (let k = 0; k <= steps; k++) {
            fb.push({ x: k, y: scale * Math.pow(qFb, k) * (1 + 0.02 * Math.sin(0.2 * k)) });
            dr.push({ x: k, y: scale * Math.pow(qDr, k) * (1 + 0.03 * Math.cos(0.16 * k + 0.3)) });
            base.push({ x: k, y: scale * Math.pow(qBase, k) });
        }

        return { fb, dr, base, qFb, qDr, qBase };
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

        const all = series.fb.concat(series.dr, series.base);
        const yLogs = all.map((p) => Math.log10(Math.max(p.y, 1e-14)));
        const yMin = Math.min(...yLogs);
        const yMax = Math.max(...yLogs, -0.000001);
        const maxX = series.fb[series.fb.length - 1].x;

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

        drawSeries(series.fb, "#2563eb");
        drawSeries(series.dr, "#16a34a");
        drawSeries(series.base, "#dc2626");

        const legend = [
            ["Forward-Backward", "#2563eb"],
            ["Douglas-Rachford style", "#16a34a"],
            ["Conservative baseline", "#dc2626"]
        ];
        legend.forEach((row, i) => {
            const y = pad + 12 + i * 18;
            ctx.fillStyle = row[1];
            ctx.fillRect(w - 176, y, 12, 3);
            ctx.fillStyle = "#334155";
            ctx.font = "11px sans-serif";
            ctx.fillText(row[0], w - 158, y + 4);
        });

        ctx.fillStyle = "#334155";
        ctx.font = "12px sans-serif";
        ctx.fillText("log10(residual)", pad + 4, pad - 8);
        ctx.fillText("iterations", w - pad - 56, h - pad + 20);
    }

    function run() {
        const conflict = parseFloat(conflictRange.value);
        const steps = parseInt(stepsRange.value, 10);
        const scale = parseFloat(scaleRange.value);

        const series = buildSeries(conflict, steps, scale);
        draw(series);

        const endFb = series.fb[series.fb.length - 1].y;
        const endDr = series.dr[series.dr.length - 1].y;
        const endBase = series.base[series.base.length - 1].y;

        let text = "Operator Splitting Comparator\n";
        text += "---------------------------\n";
        text += `conflict=${conflict.toFixed(2)}, iterations=${steps}, initial residual=${scale.toFixed(2)}\n`;
        text += `q_fb=${series.qFb.toFixed(4)}, q_dr=${series.qDr.toFixed(4)}, q_base=${series.qBase.toFixed(4)}\n\n`;
        text += `final FB residual: ${endFb.toExponential(4)}\n`;
        text += `final DR-style residual: ${endDr.toExponential(4)}\n`;
        text += `final baseline residual: ${endBase.toExponential(4)}\n`;

        metricsBox.textContent = text;
    }

    function updateLabel() {
        paramsDisplay.textContent = `conflict=${parseFloat(conflictRange.value).toFixed(2)}, iterations=${stepsRange.value}, initial residual=${parseFloat(scaleRange.value).toFixed(1)}`;
    }

    function reset() {
        updateLabel();
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        metricsBox.textContent = "Run comparison to populate diagnostics.";
    }

    conflictRange.addEventListener("input", updateLabel);
    stepsRange.addEventListener("input", updateLabel);
    scaleRange.addEventListener("input", updateLabel);
    runBtn.addEventListener("click", run);
    resetBtn.addEventListener("click", reset);

    reset();
});
