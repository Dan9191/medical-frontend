import React, { useEffect, useState } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import ChartPanel from "./components/ChartPanel";
import "./styles.css";

let stompClient = null;

function App() {
    const [status, setStatus] = useState(null);
    const [data, setData] = useState([]);
    const [predictions, setPredictions] = useState([]); // Массив последних предсказаний
    const [isConnected, setIsConnected] = useState(false);
    const MAX_DATA_POINTS = 100;

    useEffect(() => {
        const socket = new SockJS("http://localhost:8099/ws");
        stompClient = new Client({
            webSocketFactory: () => socket,
            debug: (str) => console.log(str),
            reconnectDelay: 5000, // Автопереподключение
        });

        stompClient.onConnect = () => {
            setIsConnected(true);
            console.log("✅ Connected to backend");

            // Статус (с diagnoses)
            stompClient.subscribe("/topic/status", (msg) => {
                const parsed = JSON.parse(msg.body);
                setStatus(parsed);
                console.log("📢 STATUS:", parsed);
            });

            // Данные для графика
            stompClient.subscribe("/topic/data", (msg) => {
                const parsed = JSON.parse(msg.body);
                setData((prev) => {
                    const newData = [...prev, ...parsed.items];
                    return newData.length > MAX_DATA_POINTS ? newData.slice(-MAX_DATA_POINTS) : newData;
                });
                console.log("📊 DATA:", parsed);
            });

            // Новый топик предсказаний
            stompClient.subscribe("/topic/predictions", (msg) => {
                const parsed = JSON.parse(msg.body);
                setPredictions((prev) => [parsed, ...prev].slice(0, 5)); // Храним последние 5
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

    // Очистка данных при новом старте
    useEffect(() => {
        if (status?.type === "START") {
            setData([]);
            setPredictions([]);
        }
    }, [status?.type]);

    return (
        <div className="container">
            {/* Индикатор подключения */}
            <div className="connection-status" style={{ background: isConnected ? "#4caf50" : "#f44336" }}>
                {isConnected ? "🟢 Подключено" : "🔴 Отключено"}
            </div>

            {/* Header с пациентом */}
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

            {/* Статус и диагнозы */}
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

            {/* График */}
            <ChartPanel data={data} />

            {/* Предсказания как уведомления */}
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