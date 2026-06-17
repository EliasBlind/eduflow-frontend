import { mkdirSync, existsSync } from "fs";
import { execSync } from "child_process";

const PLUGIN = "./node_modules/.bin/protoc-gen-ts_proto";
const FLAGS = "--ts_proto_opt=esModuleInterop=true,outputClientImpl=grpc-web,env=browser";
const GOOGLEAPIS = "proto/google/api";

const GOOGLE_API_FILES = [
  "https://raw.githubusercontent.com/googleapis/googleapis/master/google/api/annotations.proto",
  "https://raw.githubusercontent.com/googleapis/googleapis/master/google/api/http.proto",
];

const targets = [
  { name: "journal", protoDir: "proto/journal/v1", out: "src/api/gen/journal" },
  { name: "sso",     protoDir: "proto/sso/v1",     out: "src/api/gen/sso"     },
];

if (!existsSync(GOOGLEAPIS)) {
  console.log("Downloading google/api protos...");
  mkdirSync(GOOGLEAPIS, { recursive: true });
  for (const url of GOOGLE_API_FILES) {
    const res = await fetch(url);
    const text = await res.text();
    const filename = url.split("/").at(-1)!;
    await Bun.write(`${GOOGLEAPIS}/${filename}`, text);
  }
}

for (const { name, protoDir, out } of targets) {
  mkdirSync(out, { recursive: true });
  execSync(
    `bunx protoc --plugin=protoc-gen-ts_proto=${PLUGIN} --proto_path=${protoDir} --proto_path=proto --ts_proto_out=${out} ${FLAGS} ${protoDir}/*.proto`,
    { stdio: "inherit" }
  );
  console.log(`${name} proto generated in ${out}`);
}
