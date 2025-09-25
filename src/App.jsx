import React, { useEffect, useState } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import ChartPanel from "./components/ChartPanel";
import "./styles.css";

let stompClient = null;

function App() {
    const [status, setStatus] = useState(null);
    const [data, setData] = useState([]);
    const [predictions, setPredictions] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const MAX_DATA_POINTS = 100;
    const TIME_WINDOW = 60;

    useEffect(() => {
        const socket = new SockJS("http://localhost:8099/ws");
        stompClient = new Client({
            webSocketFactory: () => socket,
            debug: (str) => console.log(str),
            reconnectDelay: 5000,
        });

        stompClient.onConnect = () => {
            setIsConnected(true);
            console.log("✅ Connected to backend");

            stompClient.subscribe("/topic/status", (msg) => {
                const parsed = JSON.parse(msg.body);
                setStatus(parsed);
                console.log("📢 STATUS:", parsed);
            });

            stompClient.subscribe("/topic/data", (msg) => {
                const parsed = JSON.parse(msg.body);
                if (parsed.timeSec != null && parsed.bpm != null && parsed.uterus != null) {
                    setData((prev) => {
                        const newData = [...prev, parsed];
                        const maxTime = parsed.timeSec; // Используем timeSec новой точки
                        return newData
                            .filter(d => maxTime - d.timeSec <= TIME_WINDOW)
                            .slice(-MAX_DATA_POINTS);
                    });
                    console.log("📊 DATA:", parsed);
                } else {
                    console.warn("Invalid data point:", parsed);
                }
            });

            stompClient.subscribe("/topic/predictions", (msg) => {
                const parsed = JSON.parse(msg.body);
                setPredictions((prev) => [parsed, ...prev].slice(0, 5));
                console.log("🔮 PREDICTION:", parsed);
            });
        };

        stompClient.onStompError = (frame) => {
            console.error("STOMP error:", frame);
            setIsConnected(false);
        };

        stompClient.onWebSocketError = (error) => {
            console.error("WebSocket error:", error);
            setIsConnected(false);
        };

        stompClient.activate();

        return () => {
            if (stompClient) {
                stompClient.deactivate();
                setIsConnected(false);
            }
        };
    }, []);

    useEffect(() => {
        if (status?.type === "START") {
            setData([]);
            setPredictions([]);
        }
    }, [status?.type]);

    return (
        <div className="container">
            <div className="connection-status" style={{ background: isConnected ? "#4caf50" : "#f44336" }}>
                {isConnected ? "🟢 Подключено" : "🔴 Отключено"}
            </div>
            <div className="header">
                <div className="patient-info">
                    <h1>Пациент: {status?.firstName || "Неизвестно"} {status?.lastName || ""}</h1>
                </div>
                <div
                    className="indicator"
                    style={{
                        background: status?.type === "START" ? "#4caf50" : status?.type === "FINISH" ? "#f44336" : "#9e9e9e",
                    }}
                >
                    {status?.type || "WAITING"}
                </div>
            </div>
            <div className="status-info">
                <p><strong>Статус:</strong> {status?.type} ({status?.info})</p>
                {status?.diagnoses && status.diagnoses.length > 0 && (
                    <div className="diagnoses">
                        <strong>Диагнозы:</strong>
                        <ul>
                            {status.diagnoses.map((diag, idx) => (
                                <li key={idx}>{diag}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
            <ChartPanel data={data} />
            {predictions.map((pred, idx) => (
                <div
                    key={idx}
                    className="prediction-alert"
                    style={{
                        background: pred.severity === "high" ? "#ffebee" : pred.severity === "medium" ? "#fff3e0" : "#e8f5e8",
                        borderLeft: `4px solid ${pred.severity === "high" ? "#f44336" : pred.severity === "medium" ? "#ff9800" : "#4caf50"}`,
                        marginBottom: "10px",
                    }}
                >
                    <strong>{pred.severity?.toUpperCase()}</strong>: {pred.message}
                    <br />
                    <small>{new Date(pred.timestamp).toLocaleString()}</small>
                </div>
            ))}
        </div>
    );
}

export default App;