/**
 * fix_priority_scores.js
 *
 * Force-recalculates complaintAIScore for every complaint in the DB.
 * Uses strict non-overlapping bands (unconditional update):
 *   Low       ->  13  (band  1-25)
 *   Medium    ->  38  (band 26-50)
 *   High      ->  65  (band 51-80)
 *   Emergency ->  90  (band 81-100)
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Complaint = require('./Models/Complaints');

const BAND_MIDPOINTS = {
    Low: 13,
    Medium: 38,
    High: 65,
    Emergency: 90,
};

async function run() {
    await mongoose.connect(process.env.MONGO_URL);
    process.stdout.write('Connected to MongoDB\n');

    const complaints = await Complaint.find({}).lean();
    process.stdout.write('Found ' + complaints.length + ' complaints\n');

    let updated = 0;

    for (const c of complaints) {
        const priority = c.complaintPriority || 'Low';
        const newScore = BAND_MIDPOINTS[priority] !== undefined ? BAND_MIDPOINTS[priority] : 13;
        const oldScore = c.complaintAIScore;

        await Complaint.updateOne({ _id: c._id }, { $set: { complaintAIScore: newScore } });
        process.stdout.write('FIXED  ' + c.complaintId + '  priority=' + priority + '  old=' + oldScore + '  new=' + newScore + '\n');
        updated++;
    }

    process.stdout.write('Done. Total updated: ' + updated + '\n');
    await mongoose.disconnect();
}

run().catch(function (err) {
    process.stdout.write('ERROR: ' + err.message + '\n');
    process.exit(1);
});
