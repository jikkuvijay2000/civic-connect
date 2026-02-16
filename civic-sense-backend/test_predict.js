const axios = require('axios');

async function test() {
    try {
        console.log("Testing Pothole...");
        const res1 = await axios.post('http://localhost:5001/predict', { text: "Huge pothole on the main road" });
        console.log("Pothole:", res1.data);

        console.log("Testing Garbage...");
        const res2 = await axios.post('http://localhost:5001/predict', { text: "Garbage has not been collected for days" });
        console.log("Garbage:", res2.data);

        console.log("Testing Streetlight...");
        const res3 = await axios.post('http://localhost:5001/predict', { text: "Streetlight is broken" });
        console.log("Streetlight:", res3.data);

    } catch (e) {
        console.error("Error:", e.message);
        if (e.response) console.error("Data:", e.response.data);
    }
}

test();
