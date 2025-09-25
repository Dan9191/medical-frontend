import React from "react";
import {
    LineChart,
    Line,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
} from "recharts";

function ChartPanel({ data }) {
    return (
        <LineChart width={600} height={300} data={data}>
            <Line type="monotone" dataKey="bpm" stroke="#8884d8" name="BPM" />
            <Line type="monotone" dataKey="uterus" stroke="#82ca9d" name="Uterus" />
            <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
            <XAxis dataKey="timeSec" label={{ value: "Time (s)", position: "insideBottom", offset: -5 }} />
            <YAxis />
            <Tooltip />
            <Legend />
        </LineChart>
    );
}

export default ChartPanel;
