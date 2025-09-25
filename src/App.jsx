import React, { useEffect, useState } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import ChartPanel from "./components/ChartPanel";

let stompClient = null;

function App() {
    const [status, setStatus] = useState(null);
    const [data, setData] = useState([]);

    useEffect(() => {
        // Initialize SockJS
        const socket = new SockJS("http://localhost:8099/ws");

        // Initialize STOMP client
        stompClient = new Client({
            webSocketFactory: () => socket,
            debug: (str) => {
                console.log(str);
            },
        });

        // On connect
        stompClient.onConnect = () => {
            console.log("✅ Connected to backend");

            // Subscribe to status topic
            stompClient.subscribe("/topic/status", (msg) => {
                const parsed = JSON.parse(msg.body);
                setStatus(parsed);
                console.log("📢 STATUS:", parsed);
            });

            // Subscribe to data topic
            stompClient.subscribe("/topic/data", (msg) => {
                const parsed = JSON.parse(msg.body);
                setData((prev) => [...prev, ...parsed.items]);
                console.log("📊 DATA:", parsed);
            });
        };

        // Handle errors
        stompClient.onStompError = (frame) => {
            console.error("STOMP error:", frame);
        };

        // Activate the client
        stompClient.activate();

        // Cleanup on unmount
        return () => {
            if (stompClient) {
                stompClient.deactivate();
                console.log("🔌 Disconnected from backend");
            }
        };
    }, []);

    return (
        <div className="container">
            <h1>
                Пациент: {status?.firstName} {status?.lastName}
            </h1>
            <p>
                Статус: {status?.type} ({status?.info})
            </p>

            <ChartPanel data={data} />

            <div
                className="indicator"
                style={{
                    background:
                        status?.type === "START"
                            ? "green"
                            : status?.type === "FINISH"
                                ? "red"
                                : "gray",
                }}
            >
                {status?.type || "WAITING"}
            </div>
        </div>
    );
}

export default App;