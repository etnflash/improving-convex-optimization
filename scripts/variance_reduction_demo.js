document.addEventListener("DOMContentLoaded", function () {
    const etaRange = document.getElementById("vr-eta-range");
    const epochsRange = document.getElementById("vr-epochs-range");
    const innerRange = document.getElementById("vr-inner-range");
    const noiseRange = document.getElementById("vr-noise-range");

    const paramsDisplay = document.getElementById("vr-params-display");
    const metricsBox = document.getElementById("varianceReductionMetrics");
    const canvas = document.getElementById("varianceReductionCanvas");
    const runBtn = document.getElementById("runVarianceReductionBtn");
    const resetBtn = document.getElementById("resetVarianceReductionBtn");

    if (!etaRange || !epochsRange || !innerRange || !noiseRange || !canvas || !runBtn || !resetBtn) {
        return;
    }

    const ctx = canvas.getContext("2d");

    function buildDataset(noiseScale) {
        const n = 60;
        const data = [];
        for (let i = 0; i < n; i++) {
            const a = 0.5 + (i % 10) * 0.2;
            const phase = (2 * Math.PI * i) / n;
            const noise = noiseScale * Math.sin(3 * phase);
            const b = 1.8 * a + noise;
            data.push({ a, b });
        }
        return data;
    }

    function fiGrad(sample, x) {
        return sample.a * (sample.a * x - sample.b);
    }

    function fullGrad(data, x) {
        let s = 0;
        for (const sample of data) {
            s += fiGrad(sample, x);
        }
        return s / data.length;
    }

    function objective(data, x) {
        let s = 0;
        for (const sample of data) {
            const r = sample.a * x - sample.b;
            s += 0.5 * r * r;
        }
        return s / data.length;
    }

    function runComparison() {
        const eta = parseFloat(etaRange.value);
        const epochs = parseInt(epochsRange.value, 10);
        const innerSteps = parseInt(innerRange.value, 10);
        const noise = parseFloat(noiseRange.value);

        const data = buildDataset(noise);
        const n = data.length;

        const xStar = data.reduce((acc, s) => {
            acc.num += s.a * s.b;
            acc.den += s.a * s.a;
            return acc;
        }, { num: 0, den: 0 });
        const xOpt = xStar.num / xStar.den;
        const fOpt = objective(data, xOpt);

        const budget = epochs * innerSteps;

        let xSgd = -1.0;
        const sgdSeries = [];
        let sgdEval = 0;
        for (let t = 0; t <= budget; t++) {
            const gap = Math.max(1e-16, objective(data, xSgd) - fOpt);
            sgdSeries.push({ evals: sgdEval, gap });

            const i = (17 * t + 13) % n;
            xSgd -= eta * fiGrad(data[i], xSgd);
            sgdEval += 1;
        }

        let xSvrg = -1.0;
        let svrgEval = 0;
        const svrgSeries = [{ evals: 0, gap: Math.max(1e-16, objective(data, xSvrg) - fOpt) }];

        for (let e = 0; e < epochs; e++) {
            const snapshot = xSvrg;
            const gradSnapshot = fullGrad(data, snapshot);
            svrgEval += n;

            let xInner = xSvrg;
            for (let t = 0; t < innerSteps; t++) {
                const i = (31 * (e * innerSteps + t) + 7) % n;
                const giX = fiGrad(data[i], xInner);
                const giSnap = fiGrad(data[i], snapshot);
                const g = giX - giSnap + gradSnapshot;
                xInner -= eta * g;
                svrgEval += 2;

                const gap = Math.max(1e-16, objective(data, xInner) - fOpt);
                svrgSeries.push({ evals: svrgEval, gap });
            }

            xSvrg = xInner;
        }

        drawSeries(sgdSeries, svrgSeries);

        const sgdFinal = sgdSeries[sgdSeries.length - 1].gap;
        const svrgFinal = svrgSeries[svrgSeries.length - 1].gap;
        let text = "SGD vs SVRG (1D Finite Sum)\n";
        text += "-------------------------\n";
        text += `eta = ${eta.toFixed(4)}, epochs = ${epochs}, inner = ${innerSteps}, data size = ${n}\n`;
        text += `noise scale = ${noise.toFixed(2)}\n`;
        text += `x_opt = ${xOpt.toFixed(6)}, f_opt = ${fOpt.toExponential(4)}\n\n`;
        text += `SGD final gap: ${sgdFinal.toExponential(4)} after ${sgdSeries[sgdSeries.length - 1].evals} grad evals\n`;
        text += `SVRG final gap: ${svrgFinal.toExponential(4)} after ${svrgSeries[svrgSeries.length - 1].evals} grad evals\n`;
        text += `gap ratio (SGD/SVRG): ${(sgdFinal / svrgFinal).toExponential(3)}\n`;

        metricsBox.textContent = text;
    }

    function drawSeries(sgdSeries, svrgSeries) {
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

        const maxEval = Math.max(
            sgdSeries[sgdSeries.length - 1].evals,
            svrgSeries[svrgSeries.length - 1].evals
        );

        const logs = sgdSeries.concat(svrgSeries).map((p) => Math.log10(Math.max(p.gap, 1e-16)));
        const yMin = Math.min(...logs);
        const yMax = Math.max(...logs, -0.000001);

        function tx(evals) {
            return pad + (evals / Math.max(1, maxEval)) * (w - 2 * pad);
        }

        function ty(logGap) {
            return h - pad - ((logGap - yMin) / Math.max(1e-9, yMax - yMin)) * (h - 2 * pad);
        }

        function draw(series, color) {
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            series.forEach((p, i) => {
                const x = tx(p.evals);
                const y = ty(Math.log10(Math.max(p.gap, 1e-16)));
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });
            ctx.stroke();
        }

        draw(sgdSeries, "#1d4ed8");
        draw(svrgSeries, "#dc2626");

        ctx.fillStyle = "#1d4ed8";
        ctx.fillRect(w - 152, pad + 8, 12, 3);
        ctx.fillStyle = "#334155";
        ctx.font = "12px sans-serif";
        ctx.fillText("SGD", w - 132, pad + 12);

        ctx.fillStyle = "#dc2626";
        ctx.fillRect(w - 152, pad + 28, 12, 3);
        ctx.fillStyle = "#334155";
        ctx.fillText("SVRG", w - 132, pad + 32);

        ctx.fillStyle = "#334155";
        ctx.fillText("log10(F(x)-F*)", pad + 4, pad - 8);
        ctx.fillText("gradient evaluations", w - pad - 110, h - pad + 20);
    }

    function updateLabel() {
        paramsDisplay.textContent = `eta = ${parseFloat(etaRange.value).toFixed(3)}, epochs = ${epochsRange.value}, inner = ${innerRange.value}, noise = ${parseFloat(noiseRange.value).toFixed(2)}`;
    }

    function reset() {
        updateLabel();
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        metricsBox.textContent = "Run the demo to populate metrics.";
    }

    etaRange.addEventListener("input", updateLabel);
    epochsRange.addEventListener("input", updateLabel);
    innerRange.addEventListener("input", updateLabel);
    noiseRange.addEventListener("input", updateLabel);

    runBtn.addEventListener("click", runComparison);
    resetBtn.addEventListener("click", reset);

    reset();
});
