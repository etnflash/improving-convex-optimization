document.addEventListener("DOMContentLoaded", function () {
    const xRange = document.getElementById("admm-x-range");
    const zRange = document.getElementById("admm-z-range");
    const zPrevRange = document.getElementById("admm-zprev-range");
    const cRange = document.getElementById("admm-c-range");
    const rhoRange = document.getElementById("admm-rho-range");

    const paramsDisplay = document.getElementById("admm-params-display");
    const primalDisplay = document.getElementById("admm-primal-display");
    const dualDisplay = document.getElementById("admm-dual-display");
    const normsDisplay = document.getElementById("admm-norms-display");
    const statusDisplay = document.getElementById("admm-status-display");

    if (!xRange || !zRange || !zPrevRange || !cRange || !rhoRange) {
        return;
    }

    function update() {
        const x = parseFloat(xRange.value);
        const z = parseFloat(zRange.value);
        const zPrev = parseFloat(zPrevRange.value);
        const c = parseFloat(cRange.value);
        const rho = parseFloat(rhoRange.value);

        const primalResidual = x - z - c;
        const dualResidual = rho * (z - zPrev);

        const primalNorm = Math.abs(primalResidual);
        const dualNorm = Math.abs(dualResidual);

        paramsDisplay.textContent =
            `x^k = ${x.toFixed(2)}, z^k = ${z.toFixed(2)}, z^(k-1) = ${zPrev.toFixed(2)}, c = ${c.toFixed(2)}, rho = ${rho.toFixed(2)}`;
        primalDisplay.textContent = `Primal residual: r^k = x^k - z^k - c = ${primalResidual.toFixed(4)}`;
        dualDisplay.textContent = `Dual residual: s^k = rho (z^k - z^(k-1)) = ${dualResidual.toFixed(4)}`;
        normsDisplay.textContent = `Norms: ||r^k|| = ${primalNorm.toFixed(4)}, ||s^k|| = ${dualNorm.toFixed(4)}`;

        if (primalNorm < 0.1 && dualNorm < 0.1) {
            statusDisplay.textContent = "Status: both residuals are small (near convergence).";
        } else if (primalNorm >= dualNorm) {
            statusDisplay.textContent = "Status: primal residual dominates; feasibility still needs improvement.";
        } else {
            statusDisplay.textContent = "Status: dual residual dominates; update consistency still needs improvement.";
        }
    }

    xRange.addEventListener("input", update);
    zRange.addEventListener("input", update);
    zPrevRange.addEventListener("input", update);
    cRange.addEventListener("input", update);
    rhoRange.addEventListener("input", update);

    update();
});
