document.addEventListener("DOMContentLoaded", function () {
    const kappaRange = document.getElementById("acc-kappa-range");
    const stepsRange = document.getElementById("acc-steps-range");
    const x0Range = document.getElementById("acc-x0-range");

    const paramsDisplay = document.getElementById("acc-params-display");
    const metricsBox = document.getElementById("acceleratedMetrics");
    const canvas = document.getElementById("acceleratedCanvas");
    const runBtn = document.getElementById("runAcceleratedBtn");
    const resetBtn = document.getElementById("resetAcceleratedBtn");

    if (!kappaRange || !stepsRange || !x0Range || !canvas || !runBtn || !resetBtn) {
        return;
    }

    const ctx = canvas.getContext("2d");

    function objective(L, mu, x) {
        return 0.5 * (L * x[0] * x[0] + mu * x[1] * x[1]);
    }

    function grad(L, mu, x) {
        return [L * x[0], mu * x[1]];
    }

    function simulate() {
        const kappa = Math.max(1, parseFloat(kappaRange.value));
        const steps = parseInt(stepsRange.value, 10);
        const scale = parseFloat(x0Range.value);

        const mu = 1;
        const L = kappa;
        const alpha = 1 / L;
        const beta = (Math.sqrt(kappa) - 1) / (Math.sqrt(kappa) + 1);

        let xGd = [scale, scale];
        const f0 = objective(L, mu, xGd);
        const gdSeries = [];

        for (let k = 0; k <= steps; k++) {
            const f = objective(L, mu, xGd);
            gdSeries.push({ k, ratio: f / f0 });
            const g = grad(L, mu, xGd);
            xGd = [xGd[0] - alpha * g[0], xGd[1] - alpha * g[1]];
        }

        let xPrev = [scale, scale];
        let xCurr = [scale, scale];
        const nesterovSeries = [];

        for (let k = 0; k <= steps; k++) {
            const f = objective(L, mu, xCurr);
            nesterovSeries.push({ k, ratio: f / f0 });

            const y = [
                xCurr[0] + beta * (xCurr[0] - xPrev[0]),
                xCurr[1] + beta * (xCurr[1] - xPrev[1])
            ];
            const gy = grad(L, mu, y);
            const xNext = [y[0] - alpha * gy[0], y[1] - alpha * gy[1]];
            xPrev = xCurr;
            xCurr = xNext;
        }

        draw(gdSeries, nesterovSeries);

        const gdFinal = gdSeries[gdSeries.length - 1].ratio;
        const nesFinal = nesterovSeries[nesterovSeries.length - 1].ratio;
        let text = "GD vs Nesterov (Strongly Convex Quadratic)\n";
        text += "-------------------------------------------\n";
        text += `kappa = ${kappa.toFixed(2)}, alpha = ${alpha.toFixed(5)}, beta = ${beta.toFixed(5)}\n`;
        text += `iterations = ${steps}\n`;
        text += `final GD f_k/f_0: ${gdFinal.toExponential(4)}\n`;
        text += `final Nesterov f_k/f_0: ${nesFinal.toExponential(4)}\n`;
        text += `speedup ratio (GD/Nesterov): ${(gdFinal / Math.max(nesFinal, 1e-15)).toExponential(3)}\n`;

        metricsBox.textContent = text;
    }

    function draw(gdSeries, nesterovSeries) {
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

        const maxK = gdSeries[gdSeries.length - 1].k;
        const combined = gdSeries.concat(nesterovSeries).map((p) => Math.log10(Math.max(p.ratio, 1e-14)));
        const yMin = Math.min(...combined);
        const yMax = Math.max(...combined, -0.000001);

        function tx(k) {
            return pad + (k / Math.max(1, maxK)) * (w - 2 * pad);
        }

        function ty(v) {
            return h - pad - ((v - yMin) / Math.max(1e-9, yMax - yMin)) * (h - 2 * pad);
        }

        function drawSeries(series, color) {
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            series.forEach((p, i) => {
                const x = tx(p.k);
                const y = ty(Math.log10(Math.max(p.ratio, 1e-14)));
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });
            ctx.stroke();
        }

        drawSeries(gdSeries, "#1d4ed8");
        drawSeries(nesterovSeries, "#dc2626");

        ctx.fillStyle = "#1d4ed8";
        ctx.fillRect(w - 166, pad + 6, 12, 3);
        ctx.fillStyle = "#334155";
        ctx.font = "12px sans-serif";
        ctx.fillText("Gradient Descent", w - 148, pad + 10);

        ctx.fillStyle = "#dc2626";
        ctx.fillRect(w - 166, pad + 26, 12, 3);
        ctx.fillStyle = "#334155";
        ctx.fillText("Nesterov", w - 148, pad + 30);

        ctx.fillStyle = "#334155";
        ctx.fillText("log10(f_k / f_0)", pad + 4, pad - 8);
        ctx.fillText("iterations", w - pad - 56, h - pad + 20);
    }

    function updateLabel() {
        paramsDisplay.textContent = `kappa = ${parseFloat(kappaRange.value).toFixed(1)}, iterations = ${stepsRange.value}, initial scale = ${parseFloat(x0Range.value).toFixed(1)}`;
    }

    function reset() {
        updateLabel();
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        metricsBox.textContent = "Run the demo to populate metrics.";
    }

    kappaRange.addEventListener("input", updateLabel);
    stepsRange.addEventListener("input", updateLabel);
    x0Range.addEventListener("input", updateLabel);

    runBtn.addEventListener("click", simulate);
    resetBtn.addEventListener("click", reset);

    reset();
});
