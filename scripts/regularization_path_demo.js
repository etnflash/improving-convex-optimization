document.addEventListener("DOMContentLoaded", function () {
    const lambdaRange = document.getElementById("reg-lambda-range");
    const mixRange = document.getElementById("reg-en-mix-range");
    const paramsDisplay = document.getElementById("reg-params-display");
    const currentDisplay = document.getElementById("reg-current-display");
    const metricsBox = document.getElementById("regMetricsBox");
    const canvas = document.getElementById("regCanvas");

    if (!lambdaRange || !mixRange || !canvas) {
        return;
    }

    const ctx = canvas.getContext("2d");
    const base = [2.4, -1.7, 1.1];

    function softThreshold(v, t) {
        const a = Math.abs(v) - t;
        if (a <= 0) {
            return 0;
        }
        return Math.sign(v) * a;
    }

    function l1Coeff(v, lambda) {
        return softThreshold(v, lambda);
    }

    function l2Coeff(v, lambda) {
        return v / (1 + lambda);
    }

    function elasticCoeff(v, lambda, alpha) {
        const l1Part = alpha * lambda;
        const l2Part = (1 - alpha) * lambda;
        return softThreshold(v, l1Part) / (1 + l2Part);
    }

    function computePath(kind, alpha) {
        const pts = [];
        for (let i = 0; i <= 60; i++) {
            const lambda = (3 * i) / 60;
            let vals;
            if (kind === "l1") {
                vals = base.map((b) => l1Coeff(b, lambda));
            } else if (kind === "l2") {
                vals = base.map((b) => l2Coeff(b, lambda));
            } else {
                vals = base.map((b) => elasticCoeff(b, lambda, alpha));
            }
            pts.push({ lambda: lambda, vals: vals });
        }
        return pts;
    }

    function drawCurves(l1Path, l2Path, enPath) {
        const width = canvas.width;
        const height = canvas.height;
        const pad = 45;

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);

        const all = [];
        [l1Path, l2Path, enPath].forEach((path) => {
            path.forEach((p) => {
                all.push(p.vals[0], p.vals[1], p.vals[2]);
            });
        });
        const minY = Math.min.apply(null, all);
        const maxY = Math.max.apply(null, all);
        const rangeY = Math.max(maxY - minY, 1e-9);

        function toCanvas(lambda, y) {
            const x = pad + (lambda / 3) * (width - 2 * pad);
            const yy = height - pad - ((y - minY) / rangeY) * (height - 2 * pad);
            return [x, yy];
        }

        ctx.strokeStyle = "#334155";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(pad, height - pad);
        ctx.lineTo(width - pad, height - pad);
        ctx.moveTo(pad, height - pad);
        ctx.lineTo(pad, pad);
        ctx.stroke();

        const colors = ["#ef4444", "#2563eb", "#16a34a"];

        function drawPath(path, styleFactor) {
            for (let c = 0; c < 3; c++) {
                ctx.strokeStyle = colors[c];
                ctx.lineWidth = styleFactor;
                ctx.beginPath();
                for (let i = 0; i < path.length; i++) {
                    const p = toCanvas(path[i].lambda, path[i].vals[c]);
                    if (i === 0) {
                        ctx.moveTo(p[0], p[1]);
                    } else {
                        ctx.lineTo(p[0], p[1]);
                    }
                }
                ctx.stroke();
            }
        }

        ctx.globalAlpha = 0.35;
        drawPath(l2Path, 1.5);
        ctx.globalAlpha = 0.35;
        drawPath(l1Path, 1.5);
        ctx.globalAlpha = 1;
        drawPath(enPath, 2.5);

        ctx.fillStyle = "#334155";
        ctx.font = "12px sans-serif";
        ctx.fillText("lambda", width / 2 - 16, height - 10);
        ctx.save();
        ctx.translate(14, height / 2 + 20);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText("coefficient value", 0, 0);
        ctx.restore();

        ctx.fillStyle = "#334155";
        ctx.fillText("solid: elastic", width - 130, 22);
        ctx.fillText("faint red: l1", width - 130, 38);
        ctx.fillText("faint blue: l2", width - 130, 54);
    }

    function update() {
        const lambda = parseFloat(lambdaRange.value);
        const alpha = parseFloat(mixRange.value);

        const l1 = base.map((b) => l1Coeff(b, lambda));
        const l2 = base.map((b) => l2Coeff(b, lambda));
        const en = base.map((b) => elasticCoeff(b, lambda, alpha));

        const l1Path = computePath("l1", alpha);
        const l2Path = computePath("l2", alpha);
        const enPath = computePath("en", alpha);
        drawCurves(l1Path, l2Path, enPath);

        paramsDisplay.textContent = `lambda = ${lambda.toFixed(2)}, elastic alpha = ${alpha.toFixed(2)}`;
        currentDisplay.textContent = "Current coefficients for the 3 features are shown below.";

        let txt = "Feature | L1      | L2      | Elastic\n";
        txt += "--------+---------+---------+--------\n";
        for (let i = 0; i < 3; i++) {
            txt += `${String(i + 1).padEnd(7)}| ${l1[i].toFixed(4).padEnd(7)} | ${l2[i].toFixed(4).padEnd(7)} | ${en[i].toFixed(4)}\n`;
        }
        metricsBox.textContent = txt;
    }

    lambdaRange.addEventListener("input", update);
    mixRange.addEventListener("input", update);
    update();
});
