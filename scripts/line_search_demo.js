document.addEventListener("DOMContentLoaded", function () {
    const fixedAlpha = document.getElementById("ls-fixed-alpha");
    const c1Range = document.getElementById("ls-c1");
    const rhoRange = document.getElementById("ls-rho");
    const stepsRange = document.getElementById("ls-steps");

    const paramsDisplay = document.getElementById("ls-params-display");
    const metricsBox = document.getElementById("lineSearchMetrics");
    const canvas = document.getElementById("lineSearchCanvas");
    const runBtn = document.getElementById("runLineSearchBtn");
    const resetBtn = document.getElementById("resetLineSearchBtn");

    if (!fixedAlpha || !c1Range || !rhoRange || !stepsRange || !canvas || !runBtn || !resetBtn) {
        return;
    }

    const ctx = canvas.getContext("2d");

    function objective(x) {
        return 0.5 * (12 * x[0] * x[0] + x[1] * x[1]);
    }

    function grad(x) {
        return [12 * x[0], x[1]];
    }

    function dot(a, b) {
        return a[0] * b[0] + a[1] * b[1];
    }

    function runFixed(alpha, steps) {
        let x = [2.2, -1.8];
        const f0 = objective(x);
        const series = [];
        for (let k = 0; k <= steps; k++) {
            series.push({ x: k, y: Math.max(1e-16, objective(x) / f0) });
            const g = grad(x);
            x = [x[0] - alpha * g[0], x[1] - alpha * g[1]];
        }
        return { series, final: objective(x), btSteps: 0 };
    }

    function runBacktracking(c1, rho, steps) {
        let x = [2.2, -1.8];
        const f0 = objective(x);
        const series = [];
        let totalBacktracks = 0;

        for (let k = 0; k <= steps; k++) {
            series.push({ x: k, y: Math.max(1e-16, objective(x) / f0) });

            const g = grad(x);
            const p = [-g[0], -g[1]];
            const fx = objective(x);
            const gtp = dot(g, p);
            let alpha = 1.0;

            while (objective([x[0] + alpha * p[0], x[1] + alpha * p[1]]) > fx + c1 * alpha * gtp) {
                alpha *= rho;
                totalBacktracks += 1;
                if (alpha < 1e-6) {
                    break;
                }
            }

            x = [x[0] + alpha * p[0], x[1] + alpha * p[1]];
        }

        return { series, final: objective(x), btSteps: totalBacktracks };
    }

    function draw(fixedSeries, btSeries) {
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

        const maxX = fixedSeries[fixedSeries.length - 1].x;
        const logs = fixedSeries.concat(btSeries).map((p) => Math.log10(Math.max(p.y, 1e-16)));
        const yMin = Math.min(...logs);
        const yMax = Math.max(...logs, -0.000001);

        function tx(x) {
            return pad + (x / Math.max(1, maxX)) * (w - 2 * pad);
        }

        function ty(yLog) {
            return h - pad - ((yLog - yMin) / Math.max(1e-9, yMax - yMin)) * (h - 2 * pad);
        }

        function drawSeries(series, color) {
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            series.forEach((p, i) => {
                const x = tx(p.x);
                const y = ty(Math.log10(Math.max(p.y, 1e-16)));
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });
            ctx.stroke();
        }

        drawSeries(fixedSeries, "#1d4ed8");
        drawSeries(btSeries, "#dc2626");

        ctx.fillStyle = "#1d4ed8";
        ctx.fillRect(w - 184, pad + 8, 12, 3);
        ctx.fillStyle = "#334155";
        ctx.font = "12px sans-serif";
        ctx.fillText("Fixed step", w - 164, pad + 12);

        ctx.fillStyle = "#dc2626";
        ctx.fillRect(w - 184, pad + 28, 12, 3);
        ctx.fillStyle = "#334155";
        ctx.fillText("Backtracking", w - 164, pad + 32);

        ctx.fillStyle = "#334155";
        ctx.fillText("log10(f_k / f_0)", pad + 4, pad - 8);
        ctx.fillText("iterations", w - pad - 56, h - pad + 20);
    }

    function run() {
        const alpha = parseFloat(fixedAlpha.value);
        const c1 = parseFloat(c1Range.value);
        const rho = parseFloat(rhoRange.value);
        const steps = parseInt(stepsRange.value, 10);

        const fixed = runFixed(alpha, steps);
        const bt = runBacktracking(c1, rho, steps);

        draw(fixed.series, bt.series);

        let text = "Line Search Diagnostics\n";
        text += "----------------------\n";
        text += `fixed alpha = ${alpha.toFixed(3)}\n`;
        text += `Armijo c1 = ${c1.toFixed(4)}, rho = ${rho.toFixed(2)}\n`;
        text += `iterations = ${steps}\n\n`;
        text += `final fixed objective: ${fixed.final.toExponential(4)}\n`;
        text += `final backtracking objective: ${bt.final.toExponential(4)}\n`;
        text += `total backtracking reductions: ${bt.btSteps}\n`;
        text += `final ratio (fixed/backtracking): ${(fixed.final / Math.max(bt.final, 1e-16)).toExponential(3)}\n`;

        metricsBox.textContent = text;
    }

    function updateLabel() {
        paramsDisplay.textContent = `fixed alpha = ${parseFloat(fixedAlpha.value).toFixed(2)}, c1 = ${parseFloat(c1Range.value).toFixed(4)}, rho = ${parseFloat(rhoRange.value).toFixed(2)}, iterations = ${stepsRange.value}`;
    }

    function reset() {
        updateLabel();
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        metricsBox.textContent = "Run the demo to populate diagnostics.";
    }

    fixedAlpha.addEventListener("input", updateLabel);
    c1Range.addEventListener("input", updateLabel);
    rhoRange.addEventListener("input", updateLabel);
    stepsRange.addEventListener("input", updateLabel);

    runBtn.addEventListener("click", run);
    resetBtn.addEventListener("click", reset);

    reset();
});
