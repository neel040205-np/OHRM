const fs = require('fs');

const generateJSON = () => {
    const records = [];
    const userId = "697238cae0392dd10666d771";
    let startDate = new Date("2026-01-29T16:46:30.802Z");

    for (let i = 0; i < 16; i++) {
        // Increment date by 1 day
        let newDate = new Date(startDate);
        newDate.setDate(startDate.getDate() + (i + 1));

        // Skip weekends to be realistic? User didn't specify, but usually implied.
        // Let's just do consecutive days as "copy" implies literal copy logic usually.
        // But for attendance "another 16 days", let's assume valid working days?
        // To be safe and "just like this", I'll just increment days.

        const oid = new Date().getTime().toString(16) + "000000000000"; // Mock OID or just standard
        // Actually, let's just use a placeholder or random hex
        const mockId = (Math.floor(Math.random() * 16777215).toString(16) + "000000000000000000").substring(0, 24);

        const record = {
            "_id": {
                "$oid": mockId
            },
            "user": {
                "$oid": userId
            },
            "date": {
                "$date": newDate.toISOString()
            },
            "status": "Present",
            "checkInTime": {
                "$date": newDate.toISOString()
            },
            "createdAt": {
                "$date": newDate.toISOString()
            },
            "__v": 0,
            "checkOutTime": {
                "$date": new Date(newDate.getTime() + (8 * 60 * 60 * 1000)).toISOString() // +8 hours roughly
            }
        };

        records.push(record);
    }

    fs.writeFileSync('attendance_copy.json', JSON.stringify(records, null, 2));
    console.log("Generated 'attendance_copy.json' with 16 records.");
};

generateJSON();
