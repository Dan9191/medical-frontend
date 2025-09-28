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

    // REST-запросы для получения данных пациента и статуса
    useEffect(() => {
        const fetchPatientData = async () => {
            try {
                const patientResponse = await fetch(`${deviceHttpUrl}/patient`);
                const patientData = await patientResponse.json();
                const statusResponse = await fetch(`${deviceHttpUrl}/status`);
                const inStream = await statusResponse.json();
                setStatus({ ...patientData, inStream });
                console.log("📢 PATIENT DATA:", patientData);
                console.log("📢 STATUS:", inStream);
            } catch (error) {
                console.error("Error fetching patient/status:", error);
            }
        };

        fetchPatientData(); // Первоначальный запрос
        const interval = setInterval(fetchPatientData, 10000); // Каждые 10 секунд

        return () => clearInterval(interval);
    }, []);

    // Очистка данных и предсказаний при смене пациента
    useEffect(() => {
        if (status?.id) {
            setData([]);
            setPredictions([]);
        }
    }, [status?.id]);

    // WebSocket для данных и предсказаний
    useEffect(() => {
        const socket = new SockJS(deviceWsUrl);
        stompClient = new Client({
            webSocketFactory: () => socket,
            debug: (str) => console.log(str),
            reconnectDelay: 5000,
        });

        stompClient.onConnect = () => {
            setIsConnected(true);
            console.log("✅ Connected to backend");

            stompClient.subscribe("/topic/data", (msg) => {
                const parsed = JSON.parse(msg.body);
                if (parsed.timeSec != null && parsed.bpm != null && parsed.uterus != null && parsed.riskComplications != null) {
                    setData((prev) => {
                        const newData = [...prev, parsed];
                        const maxTime = parsed.timeSec;
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
                if (parsed.message && parsed.severity && parsed.timestamp) {
                    setPredictions((prev) => [parsed, ...prev.slice(0, 6)]); // количество виджетов с предиктом
                    console.log("🔮 PREDICTION:", parsed);
                } else {
                    console.warn("Invalid prediction:", parsed);
                }
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

    return (
        <div className="container">
            <div className="connection-status" style={{ background: isConnected ? "#4caf50" : "#f44336" }}>
                {isConnected ? "🟢 Подключено" : "🔴 Отключено"}
            </div>
            <div className="header">
                <div className="patient-info">
                    <h1>Пациент: {status?.name || "Неизвестно"}</h1>
                </div>
                <div
                    className="indicator"
                    style={{
                        background: status?.inStream ? "#4caf50" : "#f44336",
                    }}
                >
                    {status?.inStream ? "IN PROGRESS" : "FINISH"}
                </div>
            </div>
            <div className="status-info">
                <p>
                    <strong>Статус:</strong> {status?.inStream ? "Мониторинг активен" : "Мониторинг завершён"}
                </p>
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
                {status?.age && <p><strong>Возраст:</strong> {status.age}</p>}
                {status?.ph && <p><strong>pH:</strong> {status.ph}</p>}
                {status?.co2 && <p><strong>CO2:</strong> {status.co2}</p>}
                {status?.glu && <p><strong>Глюкоза:</strong> {status.glu}</p>}
                {status?.lac && <p><strong>Лактат:</strong> {status.lac}</p>}
                {status?.be && <p><strong>BE:</strong> {status.be}</p>}
            </div>
            <ChartPanel data={data} />
            <div className="predictions-container">
                {predictions.length === 0 ? (
                    <div className="prediction-alert prediction-no-data">
                        <div className="prediction-text">
                            Нет предсказаний на данный момент.
                        </div>
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