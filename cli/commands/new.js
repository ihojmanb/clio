const { spawnSync } = require("child_process");
const degit = require("degit");
// const packageConfig = require("../../package/packageConfig");
const { error, info, success } = require("../lib/colors");

const TARGETS = ["node", "browser"];

exports.command = "new <project>";
exports.desc = "Create a new Clio project";
exports.builder = {
  project: {
    describe: "name of the project",
    type: "string"
  },
  target: {
    describe: "What is this project intended for (node or browser)?",
    type: "string",
    default: "node"
  }
};
exports.handler = function(argv) {
  createPackage(argv.project, argv.target);
};

function preValidations(packageName, target) {
  if (!packageName) {
    throw new Error("A project name is required.");
  }
  if (!TARGETS.includes(target)) {
    throw new Error('New command only supports "browser" or "node" targets.');
  }
  const result = spawnSync("git");
  if (result.error) {
    throw new Error("Git is required to create a new Clio project.");
  }
}

async function createPackage(packageName, target = "node") {
  try {
    preValidations(packageName, target);

    const emitter = degit(`clio-lang/template-${target}#master`, {
      cache: false,
      force: true
    });

    await emitter.clone(packageName);

    process.chdir(packageName);

    // FIXME This is messing clio.toml. Will remain commented until dependency management is fixed
    // await packageConfig.fetchDependencies();
    // info("Added Clio dependencies");

    spawnSync("git", ["init"]);
    spawnSync("git", ["add", "-A"]);
    spawnSync("git", ["commit", "-m", "Initial Commit"]);
    info("Initialized new git repository.");

    info("Initialization Complete!");
    success(
      `Run 'cd ${packageName}' to open, then 'clio run index.clio' to run the project!`
    );
  } catch (e) {
    error(e);
    process.exit(1);
  }
}

exports.createPackage = createPackage;
