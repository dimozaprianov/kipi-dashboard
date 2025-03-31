import {readdir, readFile} from "fs/promises"
import path from "path"
import {IWeeklyBuildResults} from "@/data-types/weeklyBuilds"
import {INightlyDevTestsResult} from "@/data-types/nightlyTests"
import {ObjectId} from "bson"
import {MongoClient} from "mongodb"
const __dirname = import.meta.dirname;
async function readTestsData<T>(folderPath: string): Promise<T[]> {
    // Replace with your folder path
    const result = [];

    try {
        // Read all files in the directory
        const files = await readdir(folderPath);

        // Filter JSON files
        const jsonFiles = files.filter(file => path.extname(file) === '.json');

        // Loop through each JSON file and parse its content
        for (const file of jsonFiles) {
            const filePath = path.join(folderPath, file);
            try {
                const data = await readFile(filePath, 'utf8');
                const jsonData = JSON.parse(data);
                result.push(jsonData)
            } catch (err) {
                console.error(`Error processing file ${file}:`, err);
            }
        }
    } catch (err) {
        console.error('Unable to scan directory:', err);
    }
    return result
}

const process = async function () {
    const nightlyRaw = await readTestsData<INightlyDevTestsResult>(path.join(__dirname, '../public/data/nightly-tests'))
    const weeklyRaw = await readTestsData<IWeeklyBuildResults>(path.join(__dirname, '../public/data/weekly-builds'))
    const logEntries: Record<string, any>[] = []

    async function addLog(log: string) {
        const content = await readFile(path.join(__dirname, `../public/data/logs/${log}`), 'utf8')
        const _id = new ObjectId()
        logEntries.push({
            _id,
            Content: content,
        })

        return _id
    }
    for (const nightly of nightlyRaw) {
        if (nightly.BuildLog)
            nightly.BuildLog = await addLog(nightly.BuildLog) as any
        if (nightly.TestResults?.Log) {
            nightly.TestResults.Log = await addLog(nightly.TestResults.Log) as any
        }

        for (const res of nightly.CrossPlatformBuildResults) {
            if (res.BuildLog) {
                res.BuildLog = await addLog(res.BuildLog) as any
            }
        }
    }

    for (const weekly of weeklyRaw) {
        for (const res of weekly.Results) {
            if (res.Log) {
                res.Log = await addLog(res.Log) as any
            }
        }
    }

    // connect to mongodb
    const client = new MongoClient("mongodb://localhost:27017");

    await client.connect();
    const db = client.db("kipi-ci");
    const nightlyCollection = db.collection("nightly-dev-tests-results");
    const weeklyCollection = db.collection("weekly-build-results");
    const logsCollection = db.collection("task-logs");

    await nightlyCollection.drop()
    await weeklyCollection.drop()
    await logsCollection.drop()

    await logsCollection.insertMany(logEntries)
    await nightlyCollection.insertMany(nightlyRaw)
    await weeklyCollection.insertMany(weeklyRaw)

    console.log("Data inserted successfully!");
    console.log(`${logEntries.length} log entries inserted`);

    await client.close();
}

process()