"use client";

import { Puck } from "@measured/puck";
import "@measured/puck/puck.css";
import config from "../../../puck.config";

// Initial data
const initialData = {
    content: [],
    root: {},
};

export default function EditorPage() {
    return (
        <div style={{ height: "100vh" }}>
            <Puck
                config={config}
                data={initialData}
                onPublish={async (data) => {
                    console.log("Published data:", data);
                    localStorage.setItem("puckData", JSON.stringify(data));
                    alert("Design saved!");
                }}
            />
        </div>
    );
}
