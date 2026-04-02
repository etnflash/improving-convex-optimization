document.addEventListener("DOMContentLoaded", function () {
    const cRange = document.getElementById("kkt-c-range");
    const deltaRange = document.getElementById("kkt-delta-range");
    const paramsDisplay = document.getElementById("kkt-params-display");
    const metricsBox = document.getElementById("kktMetrics");
    const canvas = document.getElementById("kktCanvas");

    if (!cRange || !deltaRange || !paramsDisplay || !metricsBox || !canvas) {
        return;
    }

    const ctx = canvas.getContext("2d");
    const d = [0.4, 0.4];

    function optimalPoint(c) {
        if (c <= 0.8) {
            return [0.4, 0.4];
        }
        return [c / 2, c / 2];
    }

    function optimalMultipliers(c) {
        const lambda1 = 0;
        const lambda2 = 0;
        const lambda3 = Math.max(0, c / 2 - 0.4);
        return [lambda1, lambda2, lambda3];
    }

    function gValues(c, x) {
        return [-x[0], -x[1], c - x[0] - x[1]];
    }

    function norm2(v) {
        return Math.hypot(v[0], v[1]);
    }

    function evaluate() {
        const c = parseFloat(cRange.value);
        const delta = parseFloat(deltaRange.value);

        const xStar = optimalPoint(c);
        const x = [xStar[0] + delta, xStar[1] - delta];
        const lambda = optimalMultipliers(c);
        const g = gValues(c, x);

        const primalFeas = Math.max(0, g[0], g[1], g[2]);
        const dualFeas = Math.max(0, -lambda[0], -lambda[1], -lambda[2]);
        const comp = [
            Math.abs(lambda[0] * g[0]),
            Math.abs(lambda[1] * g[1]),
            Math.abs(lambda[2] * g[2])
        ];

        const stationarity = [
            x[0] - d[0] - lambda[0] - lambda[2],
            x[1] - d[1] - lambda[1] - lambda[2]
        ];
        const stationarityNorm = norm2(stationarity);

        draw(c, xStar, x);

        const slaterWitness = [c / 2 + 0.4, c / 2 + 0.4];
        const gSlater = gValues(c, slaterWitness);
        const slaterHolds = gSlater.every((v) => v < 0);

        let text = "KKT Residual Check\n";
        text += "-------------------\n";
        text += `c = ${c.toFixed(2)}, delta = ${delta.toFixed(2)}\n`;
        text += `candidate x = (${x[0].toFixed(4)}, ${x[1].toFixed(4)})\n`;
        text += `reference x* = (${xStar[0].toFixed(4)}, ${xStar[1].toFixed(4)})\n\n`;

        text += `g1(x)=-x1 = ${g[0].toFixed(5)}\n`;
        text += `g2(x)=-x2 = ${g[1].toFixed(5)}\n`;
        text += `g3(x)=c-x1-x2 = ${g[2].toFixed(5)}\n\n`;

        text += `primal feasibility residual: ${primalFeas.toExponential(3)}\n`;
        text += `dual feasibility residual: ${dualFeas.toExponential(3)}\n`;
        text += `stationarity residual norm: ${stationarityNorm.toExponential(3)}\n`;
        text += `max complementarity residual: ${Math.max(...comp).toExponential(3)}\n\n`;

        text += `lambda = (${lambda[0].toFixed(4)}, ${lambda[1].toFixed(4)}, ${lambda[2].toFixed(4)})\n`;
        text += `active constraints at x: ${activeSet(g)}\n`;
        text += `Slater witness x_bar = (${slaterWitness[0].toFixed(2)}, ${slaterWitness[1].toFixed(2)})\n`;
        text += `Slater condition status: ${slaterHolds ? "satisfied" : "not satisfied"}\n`;

        metricsBox.textContent = text;
        paramsDisplay.textContent = `c = ${c.toFixed(2)}, delta = ${delta.toFixed(2)} (delta = 0 gives the KKT candidate)`;
    }

    function activeSet(g) {
        const tags = [];
        if (Math.abs(g[0]) < 1e-6) {
            tags.push("x1=0");
        }
        if (Math.abs(g[1]) < 1e-6) {
            tags.push("x2=0");
        }
        if (Math.abs(g[2]) < 1e-6) {
            tags.push("x1+x2=c");
        }
        return tags.length > 0 ? tags.join(", ") : "none";
    }

    function toCanvas(pt) {
        const pad = 30;
        const xmin = -0.1;
        const xmax = 2.4;
        const ymin = -0.1;
        const ymax = 2.4;
        const x = pad + ((pt[0] - xmin) / (xmax - xmin)) * (canvas.width - 2 * pad);
        const y = canvas.height - pad - ((pt[1] - ymin) / (ymax - ymin)) * (canvas.height - 2 * pad);
        return [x, y];
    }

    function draw(c, xStar, x) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const o = toCanvas([0, 0]);
        ctx.strokeStyle = "#94a3b8";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(20, o[1]);
        ctx.lineTo(canvas.width - 20, o[1]);
        ctx.moveTo(o[0], 20);
        ctx.lineTo(o[0], canvas.height - 20);
        ctx.stroke();

        const p1 = toCanvas([c, 0]);
        const p2 = toCanvas([0, c]);
        const pTopRight = toCanvas([2.4, 2.4]);

        ctx.fillStyle = "rgba(56, 161, 105, 0.13)";
        ctx.beginPath();
        ctx.moveTo(p1[0], p1[1]);
        ctx.lineTo(pTopRight[0], p1[1]);
        ctx.lineTo(pTopRight[0], pTopRight[1]);
        ctx.lineTo(p2[0], pTopRight[1]);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = "#16a34a";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(p1[0], p1[1]);
        ctx.lineTo(p2[0], p2[1]);
        ctx.stroke();

        const dPt = toCanvas(d);
        ctx.fillStyle = "#7c3aed";
        ctx.beginPath();
        ctx.arc(dPt[0], dPt[1], 4, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = "#334155";
        ctx.font = "12px sans-serif";
        ctx.fillText("d", dPt[0] + 6, dPt[1] - 6);

        const xStarPt = toCanvas(xStar);
        ctx.fillStyle = "#0284c7";
        ctx.beginPath();
        ctx.arc(xStarPt[0], xStarPt[1], 5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = "#334155";
        ctx.fillText("x*", xStarPt[0] + 8, xStarPt[1] - 8);

        const xPt = toCanvas(x);
        ctx.fillStyle = "#dc2626";
        ctx.beginPath();
        ctx.arc(xPt[0], xPt[1], 5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = "#334155";
        ctx.fillText("candidate", xPt[0] + 8, xPt[1] + 14);
    }

    cRange.addEventListener("input", evaluate);
    deltaRange.addEventListener("input", evaluate);

    evaluate();
});
