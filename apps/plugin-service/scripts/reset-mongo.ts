import { mongoose } from "@typegoose/typegoose";
import { connectMongoDB } from "@/db/mongoose";

async function main() {
  await connectMongoDB();
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
}

main();
