// code to connect to mongo database
import { MongoClient } from "mongodb";
import {INightlyDevTestsResult} from "../data-types/nightlyTests";
import {IWeeklyBuildResult} from "../data-types/weeklyBuilds";

export const mongoClient = new MongoClient(process.env.MONGO_URL!)
export const mongoDb = mongoClient.db(process.env.MONGO_DB_NAME!)
export const nightlyDevTestsResults = mongoDb.collection<INightlyDevTestsResult>("nightly-dev-tests-results")
export const weeklyBuildResults = mongoDb.collection<IWeeklyBuildResult>("weekly-build-results")
