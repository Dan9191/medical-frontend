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

const ChartPanel = React.memo(({ data }) => {
    // Обработка данных: фильтровать аномалии и установить null для значений 0.0
    const processedData = useMemo(() => {
        console.log("📊 Processed data input:", data); // Отладка входных данных
        return data
            .filter(d =>
                d.timeSec != null &&
                Number.isFinite(d.timeSec) &&
                d.uterus != null &&
                Number.isFinite(d.uterus) &&
                d.bpm != null &&
                Number.isFinite(d.bpm)
            )
            .map(d => ({
                ...d,
                timeSec: Math.round(d.timeSec),
                uterus: d.uterus === 0.0 || d.uterus < 0 || d.uterus > 100 ? null : d.uterus,
                bpm: d.bpm === 0.0 || d.bpm < 0 || d.bpm > 200 ? null : d.bpm,
            }));
    }, [data]);

    const maxTime = processedData[processedData.length - 1]?.timeSec || 0;
    const latestRisk = processedData[processedData.length - 1]?.riskComplications || "N/A";

    if (processedData.length === 0) {
        return <div style={{ textAlign: "center", color: "#666" }}>Ожидание данных...</div>;
    }

    console.log("📊 Processed data output:", processedData); // Отладка обработанных данных

    return (
        <div className="chart-container" style={{ width: "100%", overflowX: "auto" }}>
            <h3 style={{ margin: "0 0 15px 0", color: "#333" }}>Мониторинг показателей</h3>

            {/* Общий контейнер для графиков с динамической шириной для прокрутки */}
            <div style={{ minWidth: "800px", width: `${processedData.length * 10}px` }}>

                {/* График для Uterus */}
                <ResponsiveContainer width="100%" height={200}>
                    <AreaChart
                        data={processedData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        syncId="medicalChart"
                        animationDuration={300}
                        isAnimationActive={true}
                    >
                        <defs>
                            <linearGradient id="uterusGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                        <XAxis
                            dataKey="timeSec"
                            label={{ value: "Время (сек)", position: "insideBottom", offset: -5, fill: "#666" }}
                            tick={{ fill: "#666" }}
                            domain={['dataMin', 'dataMax']}
                            tickFormatter={(value) => value}
                            animationDuration={300}
                        />
                        <YAxis
                            label={{ value: "Утерус", angle: -90, position: "insideLeft", fill: "#666" }}
                            tick={{ fill: "#666" }}
                            domain={[0, 150]} // Фиксированный интервал
                            allowDataOverflow={true} // Разрешить данные вне диапазона
                            tickCount={6} // Деления: 0, 20, 40, 60, 80, 100
                            animationDuration={300}
                        />
                        <Tooltip
                            labelFormatter={(value) => `Время: ${value} сек`}
                            formatter={(value, name) => [value, "Uterus"]}
                        />
                        <Legend />
                        <Area
                            type="monotone"
                            dataKey="uterus"
                            stroke="#82ca9d"
                            fillOpacity={1}
                            fill="url(#uterusGradient)"
                            name="Uterus"
                            connectNulls={false}
                            animationDuration={300}
                        />
                    </AreaChart>
                </ResponsiveContainer>

                {/* График для BPM */}
                <ResponsiveContainer width="100%" height={200} style={{ marginTop: "20px" }}>
                    <AreaChart
                        data={processedData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        syncId="medicalChart"
                        animationDuration={300}
                        isAnimationActive={true}
                    >
                        <defs>
                            <linearGradient id="bpmGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                        <XAxis
                            dataKey="timeSec"
                            label={{ value: "Время (сек)", position: "insideBottom", offset: -5, fill: "#666" }}
                            tick={{ fill: "#666" }}
                            domain={['dataMin', 'dataMax']}
                            tickFormatter={(value) => value}
                            animationDuration={300}
                        />
                        <YAxis
                            label={{ value: "BPM", angle: -90, position: "insideLeft", fill: "#666" }}
                            tick={{ fill: "#666" }}
                            domain={[0, 250]} // Фиксированный интервал
                            allowDataOverflow={true} // Разрешить данные вне диапазона
                            tickCount={5} // Деления: 0, 50, 100, 150, 200
                            animationDuration={300}
                        />
                        <Tooltip
                            labelFormatter={(value) => `Время: ${value} сек`}
                            formatter={(value, name) => [value, "BPM"]}
                        />
                        <Legend />
                        <Area
                            type="monotone"
                            dataKey="bpm"
                            stroke="#8884d8"
                            fillOpacity={1}
                            fill="url(#bpmGradient)"
                            name="BPM"
                            connectNulls={false}
                            animationDuration={300}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <p style={{ textAlign: "center", color: "#888", fontSize: "20px", marginTop: "10px" }}>
                Последнее обновление: {maxTime} сек,
                <span style={{
                    marginLeft: "10px",
                    color: latestRisk < 20 ? "#4CAF50" :
                        latestRisk < 70 ? "#FFC107" : "#F44336",
                    fontWeight: "bold",
                    fontSize: "20px"
                }}>
                    Риск осложнений: {latestRisk} %
                </span>
            </p>
        </div>
    );
});

export default ChartPanel;