import React, { useMemo } from "react";
import {
    AreaChart,
    Area,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";

const ChartPanel = React.memo(({ data, predictions }) => {
    // Обработка данных: фильтровать аномалии и установить null для значений 0.0
    const processedData = useMemo(() => {
        return data
            .filter(d => Number.isFinite(d.timeSec) && Number.isFinite(d.uterus) && Number.isFinite(d.bpm))
            .map(d => ({
                timeSec: Math.round(d.timeSec),
                uterus: d.uterus === 0.0 || d.uterus < 0 || d.uterus > 100 ? null : d.uterus,
                bpm: d.bpm === 0.0 || d.bpm < 0 || d.bpm > 200 ? null : d.bpm,
            }));
    }, [data]);

    const maxTime = processedData[processedData.length - 1]?.timeSec || 0;
    const latestRisk = predictions[0]?.riskComplication || "N/A";

    if (processedData.length === 0) {
        return <div className="no-data">Ожидание данных...</div>;
    }

    const chartConfig = {
        margin: { top: 20, right: 30, left: 20, bottom: 5 },
        syncId: "medicalChart",
        animationDuration: 300,
        isAnimationActive: true,
    };

    const xAxisConfig = {
        dataKey: "timeSec",
        label: { value: "Время (сек)", position: "insideBottom", offset: -5, fill: "#666" },
        tick: { fill: "#666" },
        domain: ["dataMin", "dataMax"],
        tickFormatter: (value) => value,
        animationDuration: 300,
    };

    return (
        <div className="chart-container">
            <h3>Мониторинг показателей</h3>
            <div className="chart-scroll" style={{ minWidth: "800px", width: `${processedData.length * 10}px` }}>
                <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={processedData} {...chartConfig}>
                        <defs>
                            <linearGradient id="uterusGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                        <XAxis {...xAxisConfig} />
                        <YAxis
                            label={{ value: "Утерус", angle: -90, position: "insideLeft", fill: "#666" }}
                            tick={{ fill: "#666" }}
                            domain={[0, 150]}
                            allowDataOverflow
                            tickCount={6}
                            animationDuration={300}
                        />
                        <Tooltip
                            labelFormatter={(value) => `Время: ${value} сек`}
                            formatter={(value) => [value, "Uterus"]}
                        />
                        <Legend />
                        <Area
                            type="monotone"
                            dataKey="uterus"
                            stroke="#82ca9d"
                            fill="url(#uterusGradient)"
                            name="Uterus"
                            connectNulls={false}
                            animationDuration={300}
                        />
                    </AreaChart>
                </ResponsiveContainer>

                <ResponsiveContainer width="100%" height={200} style={{ marginTop: "20px" }}>
                    <AreaChart data={processedData} {...chartConfig}>
                        <defs>
                            <linearGradient id="bpmGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                        <XAxis {...xAxisConfig} />
                        <YAxis
                            label={{ value: "BPM", angle: -90, position: "insideLeft", fill: "#666" }}
                            tick={{ fill: "#666" }}
                            domain={[0, 250]}
                            allowDataOverflow
                            tickCount={5}
                            animationDuration={300}
                        />
                        <Tooltip
                            labelFormatter={(value) => `Время: ${value} сек`}
                            formatter={(value) => [value, "BPM"]}
                        />
                        <Legend />
                        <Area
                            type="monotone"
                            dataKey="bpm"
                            stroke="#8884d8"
                            fill="url(#bpmGradient)"
                            name="BPM"
                            connectNulls={false}
                            animationDuration={300}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <p className="chart-footer">
                Последнее обновление: {maxTime} сек,
                <span
                    className={`risk-indicator ${
                        latestRisk < 20 ? "low-risk" : latestRisk < 70 ? "medium-risk" : "high-risk"
                    }`}
                >
                    Риск осложнений: {latestRisk} %
                </span>
            </p>
        </div>
    );
});

export default ChartPanel;