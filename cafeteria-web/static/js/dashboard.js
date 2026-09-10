const expensesCanvas = document.getElementById("gastosChart");
const expensesData = Array.isArray(dashboardData.gastos_detalle)
    ? dashboardData.gastos_detalle
    : [];

if (expensesCanvas && expensesData.length) {
    new Chart(expensesCanvas, {
        type: "bar",
        data: {
            labels: expensesData.map((expense) => expense.categoria || "Sin categoría"),
            datasets: [{
                label: "Gastos",
                data: expensesData.map((expense) => Number(expense.monto || 0)),
                backgroundColor: ["#C62828", "#E57373", "#D4A574", "#8B5A3C"],
                borderRadius: 7,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: (context) => `$${Number(context.raw).toLocaleString("es-MX", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        })}`
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: "rgba(93, 64, 55, 0.08)"
                    }
                }
            }
        }
    });
}

const profitCanvas = document.getElementById("gananciasChart");
const profitPeriod = document.getElementById("gananciasPeriodo");
const profitTotal = document.getElementById("gananciasTotal");

if (profitCanvas && profitPeriod) {
    const currencyFormatter = new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: "MXN",
        minimumFractionDigits: 2
    });
    const validOrders = pedidosData
        .filter((order) => order.fecha && Number(order.total || 0) >= 0)
        .map((order) => ({
            date: new Date(order.fecha),
            total: Number(order.total || 0)
        }))
        .filter((order) => !Number.isNaN(order.date.getTime()));

    const startOfWeek = (date) => {
        const result = new Date(date);
        const day = (result.getDay() + 6) % 7;
        result.setDate(result.getDate() - day);
        result.setHours(0, 0, 0, 0);
        return result;
    };

    const groupOrders = (period) => {
        const groups = new Map();

        validOrders.forEach((order) => {
            let key;
            let date;

            if (period === "month") {
                date = new Date(order.date.getFullYear(), order.date.getMonth(), 1);
                key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
            } else if (period === "week") {
                date = startOfWeek(order.date);
                key = date.toISOString().slice(0, 10);
            } else {
                date = new Date(order.date);
                date.setHours(0, 0, 0, 0);
                key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
            }

            const current = groups.get(key) || { date, total: 0, orders: 0 };
            current.total += order.total;
            current.orders += 1;
            groups.set(key, current);
        });

        return [...groups.values()].sort((a, b) => a.date - b.date);
    };

    const formatPeriod = (date, period) => {
        if (period === "month") {
            return new Intl.DateTimeFormat("es-MX", {
                month: "short",
                year: "numeric"
            }).format(date);
        }

        if (period === "week") {
            return `Semana ${new Intl.DateTimeFormat("es-MX", {
                day: "2-digit",
                month: "short"
            }).format(date)}`;
        }

        return new Intl.DateTimeFormat("es-MX", {
            day: "2-digit",
            month: "short"
        }).format(date);
    };

    const profitChart = new Chart(profitCanvas, {
        type: "bar",
        data: {
            labels: [],
            datasets: [
                {
                    type: "bar",
                    label: "Pedidos",
                    data: [],
                    backgroundColor: "rgba(21, 101, 192, 0.82)",
                    borderRadius: 6,
                    borderSkipped: false,
                    yAxisID: "yOrders"
                },
                {
                    type: "line",
                    label: "Ganancias",
                    data: [],
                    borderColor: "#2E7D32",
                    backgroundColor: "rgba(46, 125, 50, 0.12)",
                    pointBackgroundColor: "#2E7D32",
                    pointBorderColor: "#FFFFFF",
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    borderWidth: 3,
                    tension: 0.35,
                    yAxisID: "yProfit"
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: "top",
                    labels: {
                        boxWidth: 10,
                        boxHeight: 10,
                        color: "#5D4037",
                        usePointStyle: true
                    }
                },
                tooltip: {
                    callbacks: {
                        label: (context) => context.dataset.yAxisID === "yProfit"
                            ? `Ganancias: ${currencyFormatter.format(context.raw)}`
                            : `Pedidos: ${context.raw}`
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: "#8D6E63",
                        maxRotation: 45,
                        minRotation: 0
                    }
                },
                yOrders: {
                    beginAtZero: true,
                    position: "left",
                    grid: {
                        color: "rgba(93, 64, 55, 0.08)"
                    },
                    ticks: {
                        color: "#8D6E63",
                        precision: 0
                    },
                    title: {
                        display: true,
                        text: "Pedidos",
                        color: "#1565C0"
                    }
                },
                yProfit: {
                    beginAtZero: true,
                    position: "right",
                    grid: {
                        drawOnChartArea: false
                    },
                    ticks: {
                        color: "#2E7D32",
                        callback: (value) => currencyFormatter.format(value)
                    },
                    title: {
                        display: true,
                        text: "Ganancias",
                        color: "#2E7D32"
                    }
                }
            }
        }
    });

    const updateProfitChart = () => {
        const period = profitPeriod.value;
        const groups = groupOrders(period);
        const total = groups.reduce((sum, group) => sum + group.total, 0);

        profitChart.data.labels = groups.map((group) => formatPeriod(group.date, period));
        profitChart.data.datasets[0].data = groups.map((group) => group.orders);
        profitChart.data.datasets[1].data = groups.map((group) => group.total);
        profitChart.update();
        profitTotal.textContent = currencyFormatter.format(total);
    };

    profitPeriod.addEventListener("change", updateProfitChart);
    updateProfitChart();
}

const productCanvas = document.getElementById("productosChart");

if (productCanvas) {
    const categoryPalette = [
        "#1565C0",
        "#6C3B2A",
        "#2E7D32",
        "#F57C00",
        "#7B1FA2",
        "#00838F",
        "#C62828",
        "#5D4037"
    ];
    const categoryColors = new Map();

    const topProducts = [...productosData]
        .sort((a, b) => Number(b.stock || 0) - Number(a.stock || 0))
        .slice(0, 5);

    const normalizedProducts = topProducts.map((product) => {
        const categoryName = product.categoria?.nombre || "Sin categoría";

        if (!categoryColors.has(categoryName)) {
            const colorIndex = categoryColors.size % categoryPalette.length;
            categoryColors.set(categoryName, categoryPalette[colorIndex]);
        }

        return {
            name: product.nombre,
            stock: Number(product.stock || 0),
            category: categoryName,
            color: categoryColors.get(categoryName)
        };
    });

    const legend = document.getElementById("productCategoryLegend");
    categoryColors.forEach((color, category) => {
        const item = document.createElement("span");
        item.className = "category-legend-item";

        const marker = document.createElement("span");
        marker.className = "category-legend-color";
        marker.style.setProperty("--category-color", color);

        item.append(marker, document.createTextNode(category));
        legend.appendChild(item);
    });

    new Chart(productCanvas, {
        type: "bar",
        data: {
            labels: normalizedProducts.map((product) => product.name),
            datasets: [{
                label: "Stock",
                data: normalizedProducts.map((product) => product.stock),
                backgroundColor: normalizedProducts.map((product) => product.color),
                borderColor: normalizedProducts.map((product) => product.color),
                borderWidth: 1,
                borderRadius: 7,
                borderSkipped: false
            }]
        },
        options: {
            indexAxis: "y",
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        title: ([context]) => context?.label || "Producto",
                        label: (context) => {
                            const product = normalizedProducts[context.dataIndex];
                            return [
                                `Stock: ${product.stock}`,
                                `Categoría: ${product.category}`
                            ];
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    grid: {
                        color: "rgba(93, 64, 55, 0.08)"
                    },
                    ticks: {
                        color: "#8D6E63",
                        precision: 0
                    },
                    title: {
                        display: true,
                        text: "Unidades en stock",
                        color: "#5D4037"
                    }
                },
                y: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: "#5D4037",
                        font: {
                            weight: "600"
                        }
                    }
                }
            }
        }
    });
}

const chartCards = document.querySelectorAll(".stat-chart-card");
const chartModalBackdrop = document.getElementById("chartModalBackdrop");

const resizeChartsAfterModalTransition = () => {
    window.setTimeout(() => {
        Object.values(Chart.instances).forEach((chart) => chart.resize());
    }, 280);
};

const closeChartModal = () => {
    const openCard = document.querySelector(".stat-chart-card.is-modal-open");
    if (!openCard) {
        return;
    }

    openCard.classList.remove("is-modal-open");
    openCard.setAttribute("aria-expanded", "false");
    openCard.setAttribute("aria-modal", "false");
    openCard.setAttribute("role", "button");
    chartModalBackdrop.classList.remove("is-visible");
    chartModalBackdrop.setAttribute("aria-hidden", "true");
    document.body.classList.remove("chart-modal-open");
    resizeChartsAfterModalTransition();
    openCard.focus();
};

const openChartModal = (card) => {
    document.querySelectorAll(".stat-chart-card.is-modal-open").forEach((openCard) => {
        openCard.classList.remove("is-modal-open");
    });

    card.classList.add("is-modal-open");
    card.setAttribute("aria-expanded", "true");
    card.setAttribute("aria-modal", "true");
    card.setAttribute("role", "dialog");
    chartModalBackdrop.classList.add("is-visible");
    chartModalBackdrop.setAttribute("aria-hidden", "false");
    document.body.classList.add("chart-modal-open");
    resizeChartsAfterModalTransition();
    card.querySelector(".chart-modal-close").focus();
};

chartCards.forEach((card) => {
    const chartName = card.querySelector("h3")?.textContent || "estadísticas";
    card.setAttribute("role", "button");
    card.setAttribute("tabindex", "0");
    card.setAttribute("aria-expanded", "false");
    card.setAttribute("aria-label", `Abrir gráfica de ${chartName}`);

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "chart-modal-close";
    closeButton.setAttribute("aria-label", "Cerrar gráfica ampliada");
    closeButton.innerHTML = '<i class="bi bi-x-lg" aria-hidden="true"></i>';
    closeButton.addEventListener("click", (event) => {
        event.stopPropagation();
        closeChartModal();
    });
    card.appendChild(closeButton);

    card.addEventListener("click", (event) => {
        if (card.classList.contains("is-modal-open") || event.target.closest("select, option, a, button")) {
            return;
        }
        openChartModal(card);
    });

    card.addEventListener("keydown", (event) => {
        if (card.classList.contains("is-modal-open") || event.target !== card) {
            return;
        }
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openChartModal(card);
        }
    });
});

chartModalBackdrop.addEventListener("click", closeChartModal);

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        closeChartModal();
    }
});
