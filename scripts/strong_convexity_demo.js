document.addEventListener("DOMContentLoaded", function () {
    const kappaRange = document.getElementById("sc-kappa-range");
    const stepsRange = document.getElementById("sc-steps-range");
    const x0Range = document.getElementById("sc-x0-range");

    const paramsDisplay = document.getElementById("sc-params-display");
    const metricsBox = document.getElementById("strongConvexityMetrics");
    const canvas = document.getElementById("strongConvexityCanvas");
    const runBtn = document.getElementById("runStrongConvexityBtn");
    const resetBtn = document.getElementById("resetStrongConvexityBtn");

    if (!kappaRange || !stepsRange || !x0Range || !canvas || !runBtn || !resetBtn) {
        return;
    }

    const ctx = canvas.getContext("2d");

    function matVecDiag(L, mu, x) {
        return [L * x[0], mu * x[1]];
    }

    function objective(L, mu, x) {
        return 0.5 * (L * x[0] * x[0] + mu * x[1] * x[1]);
    }

    function runSimulation() {
        const kappa = Math.max(1, parseFloat(kappaRange.value));
        const steps = parseInt(stepsRange.value, 10);
        const scale = parseFloat(x0Range.value);

        const mu = 1;
        const L = kappa;
        const alpha = 2 / (L + mu);
        const qTheory = (kappa - 1) / (kappa + 1);

        let x = [scale, scale];
        const series = [];
        const f0 = objective(L, mu, x);

        for (let k = 0; k <= steps; k++) {
            const f = objective(L, mu, x);
            series.push({ k, fRatio: f / f0, xNorm: Math.hypot(x[0], x[1]) });

            const g = matVecDiag(L, mu, x);
            x = [x[0] - alpha * g[0], x[1] - alpha * g[1]];
        }

        drawCurve(series);

        const final = series[series.length - 1];
        const predicted = Math.pow(qTheory, steps);
        let text = "Strong Convexity/Smoothness Diagnostics\n";
        text += "------------------------------------\n";
        text += `mu = ${mu.toFixed(2)}, L = ${L.toFixed(2)}, kappa = ${kappa.toFixed(2)}\n`;
        text += `alpha* = 2/(L+mu) = ${alpha.toFixed(5)}\n`;
        text += `theory contraction q = (kappa-1)/(kappa+1) = ${qTheory.toFixed(5)}\n`;
        text += `predicted ||x_k|| ratio after ${steps} steps: ${predicted.toExponential(3)}\n`;
        text += `observed f_k / f_0: ${final.fRatio.toExponential(3)}\n`;
        text += "\nTail samples (k, f_k/f_0):\n";

        const tail = series.slice(Math.max(0, series.length - 8));
        for (const pt of tail) {
            text += `${String(pt.k).padStart(3)} : ${pt.fRatio.toExponential(4)}\n`;
        }

        metricsBox.textContent = text;
    }

    function drawCurve(series) {
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

        const maxK = series[series.length - 1].k;
        const ys = series.map((p) => Math.log10(Math.max(p.fRatio, 1e-14)));
        const yMin = Math.min(...ys);
        const yMax = Math.max(...ys, -0.000001);

        function toX(k) {
            return pad + (k / Math.max(1, maxK)) * (w - 2 * pad);
        }

        function toY(y) {
            return h - pad - ((y - yMin) / Math.max(1e-9, yMax - yMin)) * (h - 2 * pad);
        }

        ctx.strokeStyle = "#2563eb";
        ctx.lineWidth = 2;
        ctx.beginPath();
        series.forEach((p, i) => {
            const x = toX(p.k);
            const y = toY(Math.log10(Math.max(p.fRatio, 1e-14)));
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.stroke();

        ctx.fillStyle = "#334155";
        ctx.font = "12px sans-serif";
        ctx.fillText("log10(f_k / f_0)", pad + 4, pad - 8);
        ctx.fillText("iterations", w - pad - 56, h - pad + 20);
    }

    function updateLabel() {
        const kappa = parseFloat(kappaRange.value);
        const steps = parseInt(stepsRange.value, 10);
        const scale = parseFloat(x0Range.value);
        paramsDisplay.textContent = `kappa = ${kappa.toFixed(1)}, iterations = ${steps}, initial scale = ${scale.toFixed(1)}`;
    }

    function resetView() {
        updateLabel();
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        metricsBox.textContent = "Run the demo to populate diagnostics.";
    }

    kappaRange.addEventListener("input", updateLabel);
    stepsRange.addEventListener("input", updateLabel);
    x0Range.addEventListener("input", updateLabel);

    runBtn.addEventListener("click", runSimulation);
    resetBtn.addEventListener("click", resetView);

    resetView();
});
