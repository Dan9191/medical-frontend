import React, { useMemo } from "react";
import {
    AreaChart,
    Area,
    Line,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";

const ChartPanel = React.memo(({ data }) => {
    if (data.length === 0) {
        return <div style={{ textAlign: "center", color: "#666" }}>Ожидание данных...</div>;
    }

    const TIME_WINDOW = 60;
    const maxTime = data[data.length - 1]?.timeSec || 0;
    const filteredData = useMemo(() => {
        return data.filter(d => maxTime - d.timeSec <= TIME_WINDOW);
    }, [data, maxTime]);

    return (
        <div className="chart-container">
            <h3 style={{ margin: "0 0 15px 0", color: "#333" }}>Мониторинг показателей</h3>
            <ResponsiveContainer width="100%" height={400}>
                <AreaChart
                    data={filteredData}
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
                        domain={[maxTime - TIME_WINDOW, maxTime]}
                        tickFormatter={(value) => Math.round(value)}
                        animationDuration={300}
                    />
                    <YAxis
                        label={{ value: "Значение", angle: -90, position: "insideLeft", fill: "#666" }}
                        tick={{ fill: "#666" }}
                        domain={['auto', 'auto']}
                        animationDuration={300}
                    />
                    <Tooltip
                        labelFormatter={(value) => `Время: ${value} сек`}
                        formatter={(value, name) => [value, name === "bpm" ? "ЧСС (BPM)" : "Утерус"]}
                    />
                    <Legend />
                    <Area
                        type="monotone"
                        dataKey="uterus"
                        stroke="#82ca9d"
                        fillOpacity={1}
                        fill="url(#uterusGradient)"
                        name="Утерус (фон)"
                        animationBegin={filteredData.length - 1} // Анимация только для последней точки
                        animationDuration={300}
                    />
                    <Line
                        type="monotone"
                        dataKey="bpm"
                        stroke="#8884d8"
                        strokeWidth={3}
                        dot={false}
                        name="ЧСС (BPM)"
                        animationBegin={filteredData.length - 1} // Анимация только для последней точки
                        animationDuration={300}
                        activeDot={{ r: 6 }}
                    />
                </AreaChart>
            </ResponsiveContainer>
            <p style={{ textAlign: "center", color: "#888", fontSize: "12px", marginTop: "10px" }}>
                Последнее обновление: {maxTime} сек
            </p>
        </div>
    );
});

export default ChartPanel;