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
    const TIME_WINDOW = 120;
    const deviceHttpUrl = process.env.REACT_APP_DEVICE_HTTP || 'http://localhost:8099/v1/device';
    const deviceWsUrl = process.env.REACT_APP_DEVICE_WS || 'http://localhost:8099/ws';

    // Получение данных пациента
    useEffect(() => {
        const fetchPatientData = async () => {
            try {
                const response = await fetch(`${deviceHttpUrl}/patient`);
                const patientData = await response.json();
                setStatus(patientData);
            } catch (error) {
                console.error("Ошибка получения данных пациента:", error);
            }
        };

        fetchPatientData();
        const interval = setInterval(fetchPatientData, 10000);
        return () => clearInterval(interval);
    }, []);

    // Очистка данных при смене пациента
    useEffect(() => {
        if (status?.id) {
            setData([]);
            setPredictions([]);
        }
    }, [status?.id]);

    // WebSocket подключение
    useEffect(() => {
        const socket = new SockJS(deviceWsUrl);
        stompClient = new Client({
            webSocketFactory: () => socket,
            reconnectDelay: 5000,
        });

        stompClient.onConnect = () => {
            setIsConnected(true);
            stompClient.subscribe("/topic/data", (msg) => {
                const parsed = JSON.parse(msg.body);
                if (parsed.timeSec != null && parsed.bpm != null && parsed.uterus != null) {
                    setData((prev) => [
                        ...prev.filter(d => parsed.timeSec - d.timeSec <= TIME_WINDOW),
                        parsed,
                    ].slice(-MAX_DATA_POINTS));
                }
            });

            stompClient.subscribe("/topic/predictions", (msg) => {
                const parsed = JSON.parse(msg.body);
                console.log("Received prediction:", parsed, "Severity:", parsed.severity || "MISSING");
                if (parsed.message && parsed.severity && parsed.timestamp && parsed.riskComplication != null) {
                    // Нормализация severity
                    const severity = parsed.severity.toLowerCase().trim();
                    if (["negative", "normal", "positive"].includes(severity)) {
                        parsed.severity = severity;
                        setPredictions((prev) => [parsed, ...prev.slice(0, 6)]);
                    } else {
                        console.warn("Invalid severity value:", severity);
                    }
                } else {
                    console.warn("Incomplete prediction data:", parsed);
                }
            });
        };

        stompClient.onStompError = () => setIsConnected(false);
        stompClient.onWebSocketError = () => setIsConnected(false);
        stompClient.activate();

        return () => {
            if (stompClient) {
                stompClient.deactivate();
                setIsConnected(false);
            }
        };
    }, []);

    return (
        <div className="container">
            <div className={`connection-status ${isConnected ? "connected" : "disconnected"}`}>
                {isConnected ? "🟢 Подключено" : "🔴 Отключено"}
            </div>
            <div className="header">
                <h1>Пациент: {status?.name || "Неизвестно"}</h1>
                <div className={`indicator ${status?.status ? "in-progress" : "finished"}`}>
                    {status?.status ? "IN PROGRESS" : "FINISH"}
                </div>
            </div>
            <div className="status-info">
                <p><strong>Статус:</strong> {status?.status ? "Мониторинг активен" : "Мониторинг завершён"}</p>
                {status?.diagnoses?.length > 0 && (
                    <div className="diagnoses">
                        <strong>Диагнозы:</strong>
                        <ul>
                            {status.diagnoses.map((diag, idx) => (
                                <li key={idx}>{diag}</li>
                            ))}
                        </ul>
                    </div>
                )}
                {status?.age && <p><strong>Возраст:</strong> {status.age}</p>}
                {status?.ph && <p><strong>pH:</strong> {status.ph}</p>}
                {status?.co2 && <p><strong>CO2:</strong> {status.co2}</p>}
                {status?.glu && <p><strong>Глюкоза:</strong> {status.glu}</p>}
                {status?.lac && <p><strong>Лактат:</strong> {status.lac}</p>}
                {status?.be && <p><strong>BE:</strong> {status.be}</p>}
            </div>
            <ChartPanel data={data} predictions={predictions} />
            <div className="predictions-container">
                {predictions.length === 0 ? (
                    <div className="prediction-alert prediction-no-data">
                        Нет предсказаний на данный момент.
                    </div>
                ) : (
                    predictions.map((pred, idx) => (
                        <div
                            key={pred.timestamp || idx}
                            className={`prediction-alert ${
                                pred.severity === "negative" ? "prediction-negative" :
                                    pred.severity === "normal" ? "prediction-normal" : "prediction-positive"
                            } ${idx === 0 ? 'new-prediction' : ''}`}
                        >
                            <div className="prediction-text">
                                <div className="prediction-severity">
                                    {pred.severity?.toUpperCase() || "НЕИЗВЕСТНО"}
                                </div>
                                <div className="prediction-message">
                                    {pred.message || "Нет сообщения"}
                                </div>
                                <div className="prediction-timestamp">
                                    {pred.timestamp ? new Date(pred.timestamp).toLocaleString() : "Время неизвестно"}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default App;